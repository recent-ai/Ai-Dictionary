from ..base import SourceAdapter, RawData
import httpx
import logging
import time

logger = logging.getLogger(__name__)

# Algolia has no OR operator for `query`, so relevance is applied by running one
# search per term and merging the results. Every term is AI-anchored on purpose:
# an unqualified "Funding" or "Releases" search returns the whole front page, which
# is what the unfiltered version was already doing.
SEARCH_QUERIES = [
    "LLM",
    "AI agent",
    "language model",
    "AI",
    "AI funding",
    "AI raised",
    "AI release",
]

# Per query, not overall — the dedup below collapses the overlap between terms.
HITS_PER_QUERY = 25
MIN_POINTS = 60


class HackerNewsAdapter(SourceAdapter):
    source_name = "Hacker News"
    source_type = "api"
    tier = 1

    def fetch(self) -> list[RawData]:
        items = []
        # A story matching several terms comes back from several searches. Keyed on
        # url because that's what becomes `website`, the upsert's dedup key — two
        # objectIDs pointing at the same link would still collide there, so collapse
        # them here and spend one RawData per link.
        seen_urls = set()

        # ~28-hour window: ingestion runs once a day, so we need the whole day's
        # stories. The extra 4h overlaps the previous run to survive run-time drift;
        # the upsert dedups on `website` (ignore_duplicates=True), so repeats are free.
        # MIN_POINTS keeps the bar high enough that a full day's catch stays small.
        cutoff = int(time.time()) - 100800

        for query in SEARCH_QUERIES:
            try:
                response = httpx.get(
                    "https://hn.algolia.com/api/v1/search",
                    params={
                        "query": query,
                        "tags": "story",
                        # HN Algolia GET expects numericFilters as ONE comma-joined
                        # string with NO spaces. A Python list makes httpx emit repeated
                        # query params (numericFilters=a&numericFilters=b), which this
                        # endpoint does not AND together; a leading space makes it drop
                        # the filter.
                        "numericFilters": f"points>{MIN_POINTS},created_at_i>{cutoff}",
                        "hitsPerPage": HITS_PER_QUERY,
                    },
                    timeout=15,
                )
                response.raise_for_status()
                hits = response.json().get("hits", [])
            except Exception as e:
                logger.error(f"HackerNewsAdapter: query {query!r} failed: {e}")
                continue

            for hit in hits:
                title = hit.get("title")
                url = hit.get("url")
                if not title or not url:
                    continue
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                # Only real content goes in description. Most HN stories are
                # link posts with no body text, so this will often be empty —
                # that's honest, not a bug. Triage works off title alone in that case.
                description = hit.get("story_text") or ""

                items.append(
                    RawData(
                        title=title,
                        description=description,
                        source_url=url,
                        source_name=self.source_name,
                        source_type=self.source_type,
                        engagement_meta={
                            "points": hit.get("points", 0),
                            "num_comments": hit.get("num_comments", 0),
                            "matched_query": query,
                        },
                    )
                )

        return items
