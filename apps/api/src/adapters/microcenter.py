"""Micro Center adapter — stub unless a manual CSV/JSON feed is configured.

Micro Center does not publish a developer product/price API suitable for
automated catalog ingestion, and community staff have indicated there is no
public affiliate product-feed program comparable to Amazon/Newegg networks.

RigScout will not scrape store pages. Provide listings via ``MICROCENTER_FEED_PATH``
(operator-maintained CSV/JSON).
"""

from __future__ import annotations

from typing import Any

from src.adapters.base import NormalizedListing, RetailerAdapter
from src.adapters.manual_feed import ManualFeedAdapter


class MicroCenterAdapterNotConfigured(RuntimeError):
    """Raised when Micro Center ingestion is requested without an approved feed."""


class MicroCenterAdapter(RetailerAdapter):
    """Stub unless ``MICROCENTER_FEED_PATH`` points at a CSV/JSON feed."""

    name = "microcenter"

    def __init__(self, *, feed_path: str | None = None) -> None:
        self._feed_path = (feed_path or "").strip()
        self._feed: ManualFeedAdapter | None = None
        if self._feed_path:
            self._feed = ManualFeedAdapter(self.name, self._feed_path)
            self.status = "feed"
            self.reason = f"Micro Center manual feed enabled ({self._feed_path})"
        else:
            self.status = "stub"
            self.reason = (
                "Micro Center has no public product/price API. "
                "Set MICROCENTER_FEED_PATH to a CSV/JSON feed. "
                "HTML scraping is not supported."
            )

    @property
    def is_live_ready(self) -> bool:
        return self._feed is not None

    def match_product(self, product: dict[str, Any]) -> NormalizedListing | None:
        if self._feed is None:
            return None
        return self._feed.match_product(product)

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        if self._feed is None:
            raise MicroCenterAdapterNotConfigured(self.reason)
        return await self._feed.fetch_listings(query)

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        if self._feed is None:
            raise MicroCenterAdapterNotConfigured(self.reason)
        return await self._feed.fetch_listing(external_id)
