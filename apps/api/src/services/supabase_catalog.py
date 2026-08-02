"""Load catalog rows from Supabase PostgREST into DemoProduct shapes.

Used when SUPABASE_URL + service role are configured and products exist.
Falls back to the in-memory demo catalog on empty DB or request errors.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from statistics import mean
from typing import Any

from src.core.config import Settings
from src.core.deal_score import compute_deal_score
from src.services.demo_catalog import DemoListing, DemoProduct, DemoSpec
from src.services.supabase_rest import SupabaseRest, SupabaseRestError


def _parse_dt(value: object) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    return datetime.now(UTC)


def _as_int(value: object, default: int = 0) -> int:
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str) and value.strip().lstrip("-").isdigit():
        return int(value)
    return default


def _as_float(value: object) -> float | None:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def _score_listing(product: DemoProduct, listing: DemoListing) -> float | None:
    if listing.deal_score is not None:
        return listing.deal_score
    prices = [price for _, price in product.history]
    if not prices:
        return None
    recent_30 = prices[-30:] if len(prices) >= 30 else prices
    recent_90 = prices[-90:] if len(prices) >= 90 else prices
    return compute_deal_score(
        current_price_minor=listing.price_minor,
        avg_30d_minor=int(mean(recent_30)),
        avg_90d_minor=int(mean(recent_90)),
        historical_low_minor=min(prices),
        history_points=len(prices),
        available=listing.availability == "in_stock",
        condition=listing.condition,
        shipping_minor=listing.shipping_minor,
        retailer_confidence=0.88,
    )


def _fetch_listings(db: SupabaseRest) -> list[dict[str, Any]]:
    select = (
        "id,product_id,source,external_listing_id,product_url,price_minor,shipping_minor,"
        "currency,condition,availability,deal_score,is_mock,"
        "retailers(id,slug,name,is_marketplace,is_mock,confidence)"
    )
    try:
        return db.get(
            "retailer_listings",
            {
                "select": select,
                "is_active": "eq.true",
                "limit": "1000",
            },
        )
    except SupabaseRestError as exc:
        # Local DBs may predate the is_active migration — retry without the filter.
        if exc.status_code == 400 and "is_active" in str(exc):
            return db.get(
                "retailer_listings",
                {
                    "select": select,
                    "limit": "1000",
                },
            )
        raise


def load_products_from_supabase(settings: Settings) -> list[DemoProduct] | None:
    """Return DemoProduct list from Supabase, or None when unavailable/empty."""
    if not settings.supabase_configured:
        return None

    try:
        db = SupabaseRest(settings)
        product_rows = db.get(
            "products",
            {
                "select": (
                    "id,slug,name,brand,model,category,description,beginner_blurb,image_url,is_active"
                ),
                "is_active": "eq.true",
                "order": "name.asc",
                "limit": "1000",
            },
        )
        if not product_rows:
            return None

        listing_rows = _fetch_listings(db)
        spec_rows = db.get(
            "product_specs",
            {
                "select": "product_id,key,value,unit",
                "limit": "5000",
            },
        )
        history_rows = db.get(
            "price_history",
            {
                "select": "product_id,listing_id,price_minor,recorded_at",
                "order": "recorded_at.asc",
                "limit": "10000",
            },
        )
    except SupabaseRestError as exc:
        print(f"[RigScout API] Supabase catalog load failed — using demo fallback: {exc}")
        return None
    except Exception as exc:  # noqa: BLE001 — never break catalog reads on transport issues
        print(f"[RigScout API] Supabase catalog unexpected error — demo fallback: {exc}")
        return None

    specs_by_product: dict[str, list[DemoSpec]] = defaultdict(list)
    for row in spec_rows:
        product_id = str(row.get("product_id") or "")
        key = str(row.get("key") or "")
        value = str(row.get("value") or "")
        if not product_id or not key:
            continue
        unit = row.get("unit")
        specs_by_product[product_id].append(
            DemoSpec(key=key, value=value, unit=unit if isinstance(unit, str) else None)
        )

    history_by_product: dict[str, list[tuple[datetime, int]]] = defaultdict(list)
    for row in history_rows:
        product_id = str(row.get("product_id") or "")
        price = row.get("price_minor")
        if not product_id or not isinstance(price, int):
            continue
        history_by_product[product_id].append((_parse_dt(row.get("recorded_at")), price))

    listings_by_product: dict[str, list[DemoListing]] = defaultdict(list)
    for row in listing_rows:
        product_id = str(row.get("product_id") or "")
        listing_id = str(row.get("id") or "")
        if not product_id or not listing_id:
            continue
        retailer = row.get("retailers") if isinstance(row.get("retailers"), dict) else {}
        retailer_name = str(retailer.get("name") or row.get("source") or "Retailer")
        retailer_slug = str(retailer.get("slug") or row.get("source") or "retailer")
        listings_by_product[product_id].append(
            DemoListing(
                id=listing_id,
                retailer=retailer_name,
                retailer_slug=retailer_slug,
                source=str(row.get("source") or retailer_slug),
                external_listing_id=str(row.get("external_listing_id") or listing_id),
                product_url=str(row.get("product_url") or "https://example.com"),
                price_minor=_as_int(row.get("price_minor")),
                shipping_minor=_as_int(row.get("shipping_minor"), 0),
                currency=str(row.get("currency") or "USD"),
                condition=str(row.get("condition") or "new"),
                availability=str(row.get("availability") or "unknown"),
                is_marketplace=bool(retailer.get("is_marketplace")),
                deal_score=_as_float(row.get("deal_score")),
                is_mock=bool(row.get("is_mock", True)),
            )
        )

    products: list[DemoProduct] = []
    for row in product_rows:
        product_id = str(row.get("id") or "")
        slug = str(row.get("slug") or "")
        if not product_id or not slug:
            continue
        listings = listings_by_product.get(product_id, [])
        if not listings:
            continue
        history = history_by_product.get(product_id, [])
        if not history:
            best = min(listings, key=lambda item: item.price_minor + (item.shipping_minor or 0))
            history = [(datetime.now(UTC), best.price_minor)]

        product = DemoProduct(
            id=product_id,
            slug=slug,
            name=str(row.get("name") or slug),
            brand=str(row.get("brand") or ""),
            model=str(row.get("model") or ""),
            category=str(row.get("category") or "peripherals"),
            description=str(row.get("description") or ""),
            beginner_blurb=str(row.get("beginner_blurb") or ""),
            specs=specs_by_product.get(product_id, []),
            listings=listings,
            history=sorted(history, key=lambda point: point[0]),
        )
        for listing in product.listings:
            listing.deal_score = _score_listing(product, listing)
        products.append(product)

    return products or None
