"""Manual CSV/JSON retailer feed importer (Newegg, Micro Center, shared).

Neither Newegg nor Micro Center exposes a public catalog/price search API that
RigScout can call. Affiliate product feeds (e.g. Newegg via Impact/CJ once
approved) or operator-maintained spreadsheets are the legitimate path.

This module:
  - Parses a shared RigScout feed schema (CSV or JSON)
  - Loads from a local path or http(s) URL
  - Exposes ManualFeedAdapter for sync orchestration
  - Never scrapes HTML

Feed schema (CSV headers or JSON object keys):
  required: external_listing_id, product_url, title
  price:    price_minor (cents) OR price / sale_price (dollars)
  optional: brand, category, condition, availability, currency,
            shipping_minor OR shipping (dollars), product_slug, product_id,
            image_url
"""

from __future__ import annotations

import csv
import io
import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx

from src.adapters.base import Availability, ListingCondition, NormalizedListing, RetailerAdapter

FEED_SOURCES = frozenset({"newegg", "microcenter"})

_CONDITION_MAP = {
    "new": "new",
    "used": "used",
    "refurbished": "refurbished",
    "refurb": "refurbished",
    "open box": "used",
    "open-box": "used",
    "pre-owned": "used",
    "preowned": "used",
}

_AVAIL_MAP = {
    "in_stock": "in_stock",
    "instock": "in_stock",
    "in stock": "in_stock",
    "available": "in_stock",
    "out_of_stock": "out_of_stock",
    "outofstock": "out_of_stock",
    "out of stock": "out_of_stock",
    "sold out": "out_of_stock",
    "preorder": "preorder",
    "pre-order": "preorder",
    "pre order": "preorder",
    "unknown": "unknown",
}


class ManualFeedError(RuntimeError):
    """Raised when a retailer feed cannot be loaded or parsed."""


@dataclass(frozen=True)
class FeedRow:
    """One parsed feed row before DB product resolution."""

    listing: NormalizedListing
    product_slug: str | None = None
    product_id: str | None = None


def dollars_to_minor(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        amount = float(str(value).replace(",", "").replace("$", "").strip())
    except (TypeError, ValueError):
        return None
    if amount < 0:
        return None
    return int(round(amount * 100))


def parse_price_minor(row: dict[str, Any]) -> int | None:
    for key in ("price_minor", "priceMinor", "price_cents"):
        raw = row.get(key)
        if raw is None or raw == "":
            continue
        try:
            cents = int(float(str(raw).replace(",", "").strip()))
        except (TypeError, ValueError):
            continue
        if cents >= 0:
            return cents
    for key in ("price", "sale_price", "salePrice", "current_price"):
        cents = dollars_to_minor(row.get(key))
        if cents is not None:
            return cents
    return None


def parse_shipping_minor(row: dict[str, Any]) -> int | None:
    for key in ("shipping_minor", "shippingMinor", "shipping_cents"):
        raw = row.get(key)
        if raw is None or raw == "":
            continue
        try:
            cents = int(float(str(raw).replace(",", "").strip()))
        except (TypeError, ValueError):
            continue
        if cents >= 0:
            return cents
    return dollars_to_minor(row.get("shipping"))


def map_condition(raw: object) -> ListingCondition:
    text = str(raw or "new").strip().lower()
    return _CONDITION_MAP.get(text, "new")  # type: ignore[return-value]


def map_availability(raw: object) -> Availability:
    text = str(raw or "unknown").strip().lower()
    return _AVAIL_MAP.get(text, "unknown")  # type: ignore[return-value]


def _first_str(row: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = row.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if value is not None and not isinstance(value, (dict, list)) and str(value).strip():
            return str(value).strip()
    return None


def normalize_feed_row(
    row: dict[str, Any],
    *,
    source: str,
    now: datetime | None = None,
) -> FeedRow | None:
    """Map one CSV/JSON object to FeedRow. Returns None if required fields missing."""
    if source not in FEED_SOURCES:
        raise ManualFeedError(f"Unsupported feed source '{source}'")

    external_id = _first_str(row, "external_listing_id", "external_id", "sku", "item_number", "itemNumber")
    product_url = _first_str(row, "product_url", "url", "link")
    title = _first_str(row, "title", "name", "product_name")
    price_minor = parse_price_minor(row)
    if not external_id or not product_url or not title or price_minor is None:
        return None
    if not product_url.startswith(("http://", "https://")):
        return None

    checked = now or datetime.now(UTC)
    listing = NormalizedListing(
        source=source,
        external_listing_id=external_id,
        product_url=product_url,
        title=title,
        brand=_first_str(row, "brand", "manufacturer"),
        category=_first_str(row, "category"),
        price_minor=price_minor,
        currency=(_first_str(row, "currency") or "USD").upper(),
        shipping_minor=parse_shipping_minor(row),
        condition=map_condition(row.get("condition")),
        availability=map_availability(row.get("availability") or row.get("stock")),
        last_checked_at=checked,
        image_url=_first_str(row, "image_url", "image", "imageUrl"),
        is_mock=False,
    )
    return FeedRow(
        listing=listing,
        product_slug=_first_str(row, "product_slug", "slug"),
        product_id=_first_str(row, "product_id", "productId"),
    )


def _detect_format(text: str, hint: str | None) -> str:
    if hint in {"csv", "json"}:
        return hint
    stripped = text.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        return "json"
    return "csv"


def parse_feed_text(
    text: str,
    *,
    source: str,
    fmt: str | None = None,
    now: datetime | None = None,
) -> list[FeedRow]:
    """Parse CSV or JSON feed body into FeedRows (skips invalid rows)."""
    kind = _detect_format(text, fmt)
    checked = now or datetime.now(UTC)
    rows_raw: list[dict[str, Any]]

    if kind == "json":
        data = json.loads(text)
        if isinstance(data, dict):
            listings = data.get("listings") or data.get("items") or data.get("products")
            if not isinstance(listings, list):
                raise ManualFeedError("JSON feed must be an array or object with listings[]")
            rows_raw = [r for r in listings if isinstance(r, dict)]
        elif isinstance(data, list):
            rows_raw = [r for r in data if isinstance(r, dict)]
        else:
            raise ManualFeedError("JSON feed must be an array or object with listings[]")
    else:
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            raise ManualFeedError("CSV feed has no header row")
        rows_raw = [{(k or "").strip(): v for k, v in row.items()} for row in reader]

    parsed: list[FeedRow] = []
    for row in rows_raw:
        # Allow per-row source override only when it matches the expected source
        row_source = _first_str(row, "source") or source
        if row_source != source:
            continue
        item = normalize_feed_row(row, source=source, now=checked)
        if item is not None:
            parsed.append(item)
    return parsed


def load_feed_text(location: str, *, timeout: float = 30.0) -> tuple[str, str | None]:
    """Load feed body from local path or http(s) URL. Returns (text, format_hint)."""
    loc = location.strip()
    if not loc:
        raise ManualFeedError("Feed location is empty")

    parsed = urlparse(loc)
    if parsed.scheme in {"http", "https"}:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            response = client.get(loc)
        if response.status_code >= 400:
            raise ManualFeedError(f"Feed URL HTTP {response.status_code}: {loc}")
        content_type = response.headers.get("content-type", "").lower()
        hint = "json" if "json" in content_type else ("csv" if "csv" in content_type else None)
        return response.text, hint

    path = Path(loc).expanduser()
    if not path.is_file():
        raise ManualFeedError(f"Feed file not found: {path}")
    suffix = path.suffix.lower()
    hint = "json" if suffix == ".json" else ("csv" if suffix in {".csv", ".tsv"} else None)
    return path.read_text(encoding="utf-8"), hint


def load_feed_rows(location: str, *, source: str) -> list[FeedRow]:
    text, hint = load_feed_text(location)
    return parse_feed_text(text, source=source, fmt=hint)


class ManualFeedAdapter(RetailerAdapter):
    """Adapter backed by an operator-supplied CSV/JSON feed (no live retailer API)."""

    status = "feed"

    def __init__(
        self,
        source: str,
        feed_location: str,
        *,
        rows: list[FeedRow] | None = None,
    ) -> None:
        if source not in FEED_SOURCES:
            raise ValueError(f"Unsupported feed source '{source}'")
        self.name = source
        self.feed_location = feed_location.strip()
        self._rows = rows
        self.reason = f"Manual/affiliate feed configured ({self.feed_location})"

    @property
    def is_live_ready(self) -> bool:
        return bool(self.feed_location)

    def _ensure_rows(self) -> list[FeedRow]:
        if self._rows is None:
            self._rows = load_feed_rows(self.feed_location, source=self.name)
        return self._rows

    def match_product(self, product: dict[str, Any]) -> NormalizedListing | None:
        """Prefer exact product_id / product_slug match from the feed."""
        rows = self._ensure_rows()
        product_id = str(product.get("id") or "").strip()
        slug = str(product.get("slug") or "").strip().lower()
        for row in rows:
            if product_id and row.product_id and row.product_id == product_id:
                return row.listing
            if slug and row.product_slug and row.product_slug.lower() == slug:
                return row.listing
        return None

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        rows = self._ensure_rows()
        listings = [row.listing for row in rows]
        if not query or not query.strip():
            return listings
        tokens = [t for t in re.split(r"[^a-z0-9]+", query.lower()) if len(t) > 1]
        if not tokens:
            return listings

        def matches(listing: NormalizedListing) -> bool:
            hay = f"{listing.title} {listing.brand or ''} {listing.external_listing_id}".lower()
            return all(token in hay for token in tokens[:6])

        filtered = [item for item in listings if matches(item)]
        return filtered or listings

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        target = external_id.strip()
        if not target:
            return None
        for row in self._ensure_rows():
            if row.listing.external_listing_id == target:
                return row.listing
        return None
