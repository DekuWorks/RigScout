"""Micro Center adapter — stub only (no public product API).

Micro Center does not publish a developer product/price API suitable for
automated catalog ingestion. RigScout will not scrape store pages.

Future options (documented only): manual CSV import, affiliate deep links, or
an official partner feed if Micro Center offers one.
"""

from __future__ import annotations

from src.adapters.base import NormalizedListing, RetailerAdapter


class MicroCenterAdapterNotConfigured(RuntimeError):
    """Raised when Micro Center ingestion is requested without an approved feed."""


class MicroCenterAdapter(RetailerAdapter):
    """Stub adapter — implements the contract but refuses live fetches."""

    name = "microcenter"
    status = "stub"
    reason = (
        "Micro Center has no public product/price API. "
        "Use manual/CSV/affiliate import later. HTML scraping is not supported."
    )

    @property
    def is_live_ready(self) -> bool:
        return False

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        raise MicroCenterAdapterNotConfigured(self.reason)

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        raise MicroCenterAdapterNotConfigured(self.reason)
