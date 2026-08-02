"""Common retailer-adapter interface.

New sources implement RetailerAdapter without changing ingestion orchestration.
Respect robots.txt, terms, rate limits, and affiliate requirements.
Do not bypass retailer protections or scrape when prohibited.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Literal

ListingCondition = Literal["new", "used", "refurbished"]
Availability = Literal["in_stock", "out_of_stock", "preorder", "unknown"]


@dataclass(frozen=True)
class NormalizedListing:
    """Every stored listing must capture these fields."""

    source: str
    external_listing_id: str
    product_url: str
    title: str
    brand: str | None
    category: str | None
    price_minor: int
    currency: str
    shipping_minor: int | None
    condition: ListingCondition
    availability: Availability
    last_checked_at: datetime
    image_url: str | None = None
    # Demo/mock adapters must set this so UI can label placeholder data.
    is_mock: bool = False


class RetailerAdapter(ABC):
    """Adapter contract for retailer / marketplace sources."""

    name: str

    @abstractmethod
    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        """Fetch and normalize listings from the source."""

    @abstractmethod
    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        """Fetch a single listing by external ID."""
