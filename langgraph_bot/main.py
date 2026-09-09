"""Generation run: drain the raw_api_data queue one post at a time.

Items are claimed atomically by ``fetch_pending_items`` before this module sees
them. Every terminal transition requires the row to still be ``processing``.

Provider limits are enforced at their call sites. ``PAUSE_BETWEEN_ITEMS`` is only
a politeness gap; it is not the rate-limit mechanism.

A triage outage is handled here rather than inside ``triage_node``: an isolated
failure passes one item through, but ``TRIAGE_FAILURE_THRESHOLD`` consecutive
failures halt the run and release the unprocessed claims back to ``pending``, so a
broken triage model cannot quietly burn the whole queue.
"""

import logging
import time

from backend.db.repository.fetch_raw_data import fetch_pending_items, update_status
from langgraph_bot.insert_bot_data import insert_cleaned_data

from .workflow.complete_workflow import mjorgraph, write_complete_graph_png
from .workflow.description_workflow import write_description_graph_png
from .workflow.workflow import write_graph_summarygraph_png

logger = logging.getLogger(__name__)

MAX_ITEMS_PER_RUN = 20
PAUSE_BETWEEN_ITEMS = 2

# Consecutive items whose triage call failed before the run gives up.
TRIAGE_FAILURE_THRESHOLD = 3


def build_initial_state(post: dict) -> dict:
    """Map a raw_api_data row onto the graph state.

    Source URL, raw ID, and full content preserve provenance and let the description
    agent prefer the article body over the shorter feed blurb.
    """
    return {
        "slug": "",
        "user_input": (
            "generate the post using the given data in the state and keep it beginner "
            "friendly so freshers and new developers can understand the posts."
        ),
        "messages": [],
        "data": post.get("description") or "",
        "topic": post.get("title"),
        "title": post.get("title"),
        "summary": None,
        "description": None,
        "arxiv_urls": [],
        "documents": [],
        "tavily_search_result": None,
        "code": None,
        "name": post.get("source_name"),
        "generated_image": None,
        # Provenance and the full source body.
        "source_url": post.get("website"),
        "raw_id": post.get("id"),
        "content": post.get("content"),
        # Triage and dedup can close this gate.
        "should_process": True,
    }


def _skip_reason(result: dict) -> str:
    """Return the gate-closing reason to store in raw_api_data.last_error."""
    if result.get("is_duplicate"):
        existing = (result.get("duplicate_of") or {}).get("slug", "unknown")
        return f"duplicate of {existing}"

    triage = result.get("triage") or {}
    if not triage.get("is_it_relevant", True):
        return f"triage: {triage.get('reason', 'not relevant')}"
    if triage.get("importance") is not None:
        return f"triage: importance {triage['importance']} below threshold"
    return "filtered"


def _release_claims(items: list[dict]) -> int:
    """Hand unprocessed claims back to `pending` so a later run can pick them up.

    Without this, halting mid-batch would strand every remaining row in `processing`,
    where nothing reclaims it.
    """
    released = 0
    for item in items:
        try:
            update_status(item["id"], "pending", expected_status="processing")
            released += 1
        except Exception:
            logger.error(
                "Could not release the claim on %s; it stays in processing",
                item["id"],
                exc_info=True,
            )
    return released


def run_entire_flow() -> dict:
    """Process up to MAX_ITEMS_PER_RUN atomically claimed items."""
    claimed = fetch_pending_items(limit=MAX_ITEMS_PER_RUN)
    counts = {
        "total": len(claimed),
        "succeeded": 0,
        "skipped": 0,
        "failed": 0,
        "released": 0,
    }
    consecutive_triage_failures = 0

    for index, post in enumerate(claimed, 1):
        if consecutive_triage_failures >= TRIAGE_FAILURE_THRESHOLD:
            # Halt instead of marking the rest `failed`: `failed` is terminal, so that
            # would silently discard the remainder of the queue over an outage that
            # says nothing about these items.
            logger.critical(
                "Triage failed on %d consecutive items; halting the run and releasing "
                "the %d unprocessed claim(s)",
                consecutive_triage_failures,
                len(claimed) - index + 1,
            )
            counts["released"] = _release_claims(claimed[index - 1 :])
            break

        raw_id = post["id"]
        title = post.get("title") or "<untitled>"
        logger.info("[%d/%d] %s", index, counts["total"], title[:80])

        try:
            result = mjorgraph.invoke(build_initial_state(post))

            if (result.get("triage") or {}).get("available", True):
                consecutive_triage_failures = 0
            else:
                consecutive_triage_failures += 1
                logger.warning(
                    "    triage unavailable (%d/%d consecutive)",
                    consecutive_triage_failures,
                    TRIAGE_FAILURE_THRESHOLD,
                )

            if not result.get("should_process"):
                reason = _skip_reason(result)
                update_status(
                    raw_id,
                    "skipped",
                    expected_status="processing",
                    error=reason,
                )
                counts["skipped"] += 1
                logger.info("    skipped - %s", reason)
                continue

            insert_cleaned_data(result)
            update_status(raw_id, "succeeded", expected_status="processing")
            counts["succeeded"] += 1
            logger.info("    generated -> %s", result.get("slug"))
            time.sleep(PAUSE_BETWEEN_ITEMS)

        except Exception as error:
            logger.exception("    failed - %s", error)
            try:
                update_status(
                    raw_id,
                    "failed",
                    expected_status="processing",
                    error=f"{type(error).__name__}: {error}",
                )
            except Exception:
                logger.critical(
                    "Could not persist the failed state for raw item %s; stopping the run",
                    raw_id,
                    exc_info=True,
                )
                raise
            counts["failed"] += 1

    return counts


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )

    write_description_graph_png()
    write_complete_graph_png()
    write_graph_summarygraph_png()

    summary = run_entire_flow()

    print(
        f"Run complete: {summary['succeeded']} generated, "
        f"{summary['skipped']} skipped, {summary['failed']} failed, "
        f"{summary['released']} released "
        f"(of {summary['total']} claimed)"
    )
    if summary["released"]:
        print(
            "WARNING: the run halted early on repeated triage failures. The released "
            "items are back in 'pending' and will be retried next run."
        )
    if summary["total"] and summary["succeeded"] == 0:
        print(
            "WARNING: nothing was generated. If everything was skipped, check the "
            "triage threshold; if everything failed, check the logs above."
        )
