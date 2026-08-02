"""Newegg adapter — interface only (no public catalog search API).

Newegg's published Marketplace API is for **sellers** (inventory, orders, feeds),
not third-party product/price discovery:
https://developer.newegg.com/newegg_marketplace_api/

RigScout does **not** scrape Newegg HTML. This adapter stays disabled until an
approved affiliate feed, partner catalog API, or CSV import path is wired.
"""

from __future__ import annotations

from src.adapters.base import NormalizedListing, RetailerAdapter


class NeweggAdapterNotConfigured(RuntimeError):
    """Raised when Newegg ingestion is requested without an approved data source."""


class NeweggAdapter(RetailerAdapter):
    """Stub adapter — implements the contract but refuses live fetches."""

    name = "newegg"
    status = "stub"
    reason = (
        "Newegg Marketplace API is seller-operations only; there is no public "
        "catalog/price search API for RigScout. Wire an affiliate/CSV feed later. "
        "HTML scraping is not supported."
    )

    def __init__(self, *, api_key: str | None = None, seller_id: str | None = None) -> None:
        # Seller Marketplace credentials do not unlock catalog search for buyers.
        self._api_key = (api_key or "").strip()
        self._seller_id = (seller_id or "").strip()

    @property
    def is_live_ready(self) -> bool:
        return False

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        raise NeweggAdapterNotConfigured(self.reason)

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        raise NeweggAdapterNotConfigured(self.reason)
