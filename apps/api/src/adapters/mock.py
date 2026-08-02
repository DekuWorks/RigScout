"""Mock retailer adapter — clearly labeled demo data for local development."""

from __future__ import annotations

from datetime import UTC, datetime

from src.adapters.base import NormalizedListing, RetailerAdapter


class MockRetailerAdapter(RetailerAdapter):
    name = "mock_retailer"

    def __init__(self) -> None:
        now = datetime.now(UTC)
        self._catalog: list[NormalizedListing] = [
            NormalizedListing(
                source=self.name,
                external_listing_id="mock-cpu-7800x3d",
                product_url="https://example.com/mock/7800x3d",
                title="AMD Ryzen 7 7800X3D (MOCK)",
                brand="AMD",
                category="cpu",
                price_minor=35999,
                currency="USD",
                shipping_minor=0,
                condition="new",
                availability="in_stock",
                last_checked_at=now,
                is_mock=True,
            ),
            NormalizedListing(
                source=self.name,
                external_listing_id="mock-gpu-4070s",
                product_url="https://example.com/mock/4070-super",
                title="NVIDIA GeForce RTX 4070 Super (MOCK)",
                brand="NVIDIA",
                category="gpu",
                price_minor=59999,
                currency="USD",
                shipping_minor=0,
                condition="new",
                availability="in_stock",
                last_checked_at=now,
                is_mock=True,
            ),
        ]

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        if not query:
            return list(self._catalog)
        q = query.lower()
        return [item for item in self._catalog if q in item.title.lower()]

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        for item in self._catalog:
            if item.external_listing_id == external_id:
                return item
        return None
