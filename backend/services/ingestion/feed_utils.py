"""Shared helpers for the feed-backed adapters (Arxiv, lab blogs).

`feedparser.parse(url)` does the network fetch itself, with no timeout — one
hanging source can stall the whole ingestion run. `fetch_feed()` does the fetch
with httpx (bounded + status-checked) and hands the bytes to feedparser, which
then only parses.
"""

import logging

import feedparser
import httpx

logger = logging.getLogger(__name__)

FEED_TIMEOUT = 15  # seconds; same bound as the httpx-based adapters


def fetch_feed(url: str, *, timeout: int = FEED_TIMEOUT):
    """Fetch `url` under a timeout and parse the body as a feed."""
    try:
        response = httpx.get(url, timeout=timeout, follow_redirects=True)
        response.raise_for_status()
    except Exception as e:
        logger.error("feed fetch failed for %s: %s", url, e)
        return None
    return feedparser.parse(response.content)


def entry_title_link(entry) -> tuple[str, str] | None:
    """Return (title, link) for a feed entry, or None if either is missing."""
    title = (entry.get("title") or "").strip()
    link = (entry.get("link") or "").strip()
    if not title or not link:
        return None
    return title, link
