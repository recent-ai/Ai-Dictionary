from ..base import SourceAdapter, RawData
from ..feed_utils import entry_title_link, fetch_feed
import logging

logger = logging.getLogger(__name__)

ARXIV_CATEGORIES = ["cs.AI", "cs.LG"]
MAX_PER_CATEGORY = 10

_API_BASE = "https://export.arxiv.org/api/query"


class ArxivAdapter(SourceAdapter):
    source_name = "Arxiv"
    source_type = "api"
    tier = 1

    def fetch(self) -> list[RawData]:
        items = []
        for category in ARXIV_CATEGORIES:
            url = (
                f"{_API_BASE}?search_query=cat:{category}"
                f"&sortBy=submittedDate&sortOrder=descending"
                f"&max_results={MAX_PER_CATEGORY}"
            )
            feed = fetch_feed(url)
            if feed is None:
                continue

            # `bozo` is only a warning (content-type/encoding quibbles); a valid feed
            # can trip it and still parse. Only NO entries is a real failure.
            if not feed.entries:
                logger.error(
                    f"ArxivAdapter: no entries for {category} "
                    f"(bozo={feed.bozo}, {getattr(feed, 'bozo_exception', '')})"
                )
                continue
            for entry in feed.entries:
                pair = entry_title_link(entry)
                if pair is None:
                    continue
                title, link = pair
                items.append(
                    RawData(
                        title=title,
                        description=entry.get("summary", ""),
                        source_url=link,
                        source_name=f"Arxiv ({category})",
                        source_type=self.source_type,
                    )
                )
        return items
