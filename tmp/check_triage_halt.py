"""Smoke-check the triage halt/release logic in run_entire_flow without a DB.

Stubs every import main.py pulls in, then drives three scenarios through the loop.
"""

import sys
import types
from unittest import mock

# --- stub the modules main.py imports at module scope -----------------------------
calls = {"transitions": [], "inserted": []}


def _fake_update_status(raw_id, status, *, expected_status, error=None):
    calls["transitions"].append((raw_id, status, expected_status))


fetch_mod = types.ModuleType("backend.db.repository.fetch_raw_data")
fetch_mod.fetch_pending_items = lambda limit=20: []
fetch_mod.update_status = _fake_update_status

insert_mod = types.ModuleType("langgraph_bot.insert_bot_data")
insert_mod.insert_cleaned_data = lambda state: calls["inserted"].append(
    state.get("slug")
)

for name, mod in [
    ("backend", types.ModuleType("backend")),
    ("backend.db", types.ModuleType("backend.db")),
    ("backend.db.repository", types.ModuleType("backend.db.repository")),
    ("backend.db.repository.fetch_raw_data", fetch_mod),
    ("langgraph_bot.insert_bot_data", insert_mod),
]:
    sys.modules.setdefault(name, mod)

wf = types.ModuleType("langgraph_bot.workflow.complete_workflow")
wf.mjorgraph = mock.MagicMock()
wf.write_complete_graph_png = lambda: None
desc_wf = types.ModuleType("langgraph_bot.workflow.description_workflow")
desc_wf.write_description_graph_png = lambda: None
sum_wf = types.ModuleType("langgraph_bot.workflow.workflow")
sum_wf.write_graph_summarygraph_png = lambda: None
sys.modules["langgraph_bot.workflow"] = types.ModuleType("langgraph_bot.workflow")
sys.modules["langgraph_bot.workflow.complete_workflow"] = wf
sys.modules["langgraph_bot.workflow.description_workflow"] = desc_wf
sys.modules["langgraph_bot.workflow.workflow"] = sum_wf

from langgraph_bot import main  # noqa: E402

TRIAGE_OK = {"available": True, "is_it_relevant": True, "importance": 4}
TRIAGE_DOWN = {"available": False, "is_it_relevant": True, "importance": 2}


def run(rows, results):
    calls["transitions"].clear()
    calls["inserted"].clear()
    main.fetch_pending_items = lambda limit=20: rows
    main.update_status = _fake_update_status
    main.time.sleep = lambda s: None
    main.mjorgraph.invoke = mock.MagicMock(side_effect=results)
    return main.run_entire_flow()


rows = [{"id": f"id-{n}", "title": f"post {n}"} for n in range(1, 8)]


def state(triage, slug):
    return {"triage": triage, "should_process": True, "slug": slug}


print("--- 1. all healthy: nothing released, everything generated ---")
summary = run(rows, [state(TRIAGE_OK, f"slug-{n}") for n in range(1, 8)])
print(f"  {summary}")
assert summary["succeeded"] == 7, summary
assert summary["released"] == 0, summary

print("--- 2. triage down from item 1: halts at item 4, releases 4..7 ---")
summary = run(rows, [state(TRIAGE_DOWN, f"slug-{n}") for n in range(1, 8)])
print(f"  {summary}")
assert summary["succeeded"] == 3, summary
assert summary["released"] == 4, summary
released = [t for t in calls["transitions"] if t[1] == "pending"]
assert [r[0] for r in released] == ["id-4", "id-5", "id-6", "id-7"], released
assert all(r[2] == "processing" for r in released), released
assert calls["inserted"] == ["slug-1", "slug-2", "slug-3"], calls["inserted"]

print("--- 3. one recovery resets the streak: no halt ---")
summary = run(
    rows,
    [
        state(TRIAGE_DOWN, "slug-1"),
        state(TRIAGE_DOWN, "slug-2"),
        state(TRIAGE_OK, "slug-3"),  # resets
        state(TRIAGE_DOWN, "slug-4"),
        state(TRIAGE_DOWN, "slug-5"),
        state(TRIAGE_OK, "slug-6"),  # resets
        state(TRIAGE_DOWN, "slug-7"),
    ],
)
print(f"  {summary}")
assert summary["succeeded"] == 7, summary
assert summary["released"] == 0, summary

print("\nALL ASSERTIONS PASSED")
