"""Newegg adapter — stub unless a manual/affiliate feed is configured.

Newegg's published Marketplace API is for **sellers** (inventory, orders, feeds),
not third-party product/price discovery:
https://developer.newegg.com/newegg_marketplace_api/

Affiliate product data feeds may be available after joining Newegg's program via
an approved network (e.g. Impact / CJ). Those feeds are not a public developer
API with self-serve keys like Best Buy. RigScout ingests them only via the
shared CSV/JSON manual feed path (`NEWEGG_FEED_PATH`).

HTML scraping is not supported.
"""

from __future__ import annotations

from typing import Any

from src.adapters.base import NormalizedListing, RetailerAdapter
from src.adapters.manual_feed import ManualFeedAdapter


class NeweggAdapterNotConfigured(RuntimeError):
    """Raised when Newegg ingestion is requested without an approved data source."""


class NeweggAdapter(RetailerAdapter):
    """Stub unless ``NEWEGG_FEED_PATH`` points at a CSV/JSON feed."""

    name = "newegg"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        seller_id: str | None = None,
        feed_path: str | None = None,
    ) -> None:
        # Seller Marketplace credentials do not unlock catalog search for buyers.
        self._api_key = (api_key or "").strip()
        self._seller_id = (seller_id or "").strip()
        self._feed_path = (feed_path or "").strip()
        self._feed: ManualFeedAdapter | None = None
        if self._feed_path:
            self._feed = ManualFeedAdapter(self.name, self._feed_path)
            self.status = "feed"
            self.reason = (
                f"Newegg manual/affiliate feed enabled ({self._feed_path}). "
                "Marketplace seller keys are unused for catalog search."
            )
        else:
            self.status = "stub"
            self.reason = (
                "Newegg Marketplace API is seller-operations only; there is no public "
                "catalog/price search API. Set NEWEGG_FEED_PATH to a CSV/JSON feed "
                "(affiliate export or operator file). HTML scraping is not supported."
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
            raise NeweggAdapterNotConfigured(self.reason)
        return await self._feed.fetch_listings(query)

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        if self._feed is None:
            raise NeweggAdapterNotConfigured(self.reason)
        return await self._feed.fetch_listing(external_id)
