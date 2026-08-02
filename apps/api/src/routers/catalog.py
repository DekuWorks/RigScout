"""Catalog + deals endpoints backed by the MOCK demo catalog (Phase 3).

When Supabase is populated, a future iteration can prefer DB reads and keep
this adapter as a fallback for offline demos.
"""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, HTTPException, Query

from src.services.demo_catalog import get_product, list_products, product_summary

router = APIRouter(prefix="/v1", tags=["catalog"])

SORT_OPTIONS = {"deal_score", "lowest_price", "price_drop", "name"}


@router.get("/listings")
async def list_mock_listings(q: str | None = Query(default=None)) -> dict[str, object]:
    """Backward-compatible flat listings endpoint."""
    products = list_products()
    items: list[dict[str, object]] = []
    for product in products:
        for listing in product.listings:
            if q and q.lower() not in product.name.lower() and q.lower() not in product.brand.lower():
                continue
            items.append(
                {
                    "external_listing_id": listing.external_listing_id,
                    "product_slug": product.slug,
                    "title": product.name,
                    "brand": product.brand,
                    "category": product.category,
                    "price_minor": listing.price_minor,
                    "currency": listing.currency,
                    "shipping_minor": listing.shipping_minor,
                    "condition": listing.condition,
                    "availability": listing.availability,
                    "product_url": listing.product_url,
                    "deal_score": listing.deal_score,
                    "is_mock": True,
                    "retailer": listing.retailer,
                }
            )
    return {"source": "demo_catalog", "is_mock": True, "count": len(items), "items": items}


@router.get("/products")
async def search_products(
    q: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    retailer: str | None = None,
    condition: str | None = None,
    availability: str | None = None,
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    sort: str = Query(default="deal_score"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
) -> dict[str, object]:
    if sort not in SORT_OPTIONS:
        raise HTTPException(status_code=400, detail=f"sort must be one of {sorted(SORT_OPTIONS)}")

    rows = [product_summary(p) for p in list_products()]

    def matches(row: dict[str, object], product_id: str) -> bool:
        product = get_product(str(row["slug"]))
        if product is None:
            return False
        if q:
            needle = q.lower()
            hay = f"{product.name} {product.brand} {product.model}".lower()
            if needle not in hay:
                return False
        if category and product.category != category:
            return False
        if brand and product.brand.lower() != brand.lower():
            return False
        if condition and not any(listing.condition == condition for listing in product.listings):
            return False
        if availability and not any(
            listing.availability == availability for listing in product.listings
        ):
            return False
        if retailer and not any(
            listing.retailer_slug == retailer or listing.retailer.lower() == retailer.lower()
            for listing in product.listings
        ):
            return False
        price = int(row["best_price_minor"])  # type: ignore[arg-type]
        if min_price is not None and price < min_price:
            return False
        if max_price is not None and price > max_price:
            return False
        return True

    filtered = [row for row in rows if matches(row, str(row["id"]))]

    if sort == "deal_score":
        filtered.sort(key=lambda r: (r["deal_score"] is None, -(r["deal_score"] or 0)))
    elif sort == "lowest_price":
        filtered.sort(key=lambda r: int(r["best_price_minor"]))  # type: ignore[arg-type]
    elif sort == "price_drop":
        filtered.sort(key=lambda r: int(r["price_delta_minor"]))  # type: ignore[arg-type]
    else:
        filtered.sort(key=lambda r: str(r["name"]))

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = filtered[start:end]

    brands = sorted({str(p.brand) for p in list_products()})
    retailers = sorted(
        {
            listing.retailer_slug
            for product in list_products()
            for listing in product.listings
        }
    )

    return {
        "is_mock": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": page_items,
        "facets": {
            "brands": brands,
            "retailers": retailers,
            "categories": sorted({p.category for p in list_products()}),
        },
    }


@router.get("/products/{slug}")
async def product_detail(slug: str, history_days: int = Query(default=90, ge=7, le=365)) -> dict[str, object]:
    product = get_product(slug)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    summary = product_summary(product)
    cutoff = product.history[-1][0] - timedelta(days=history_days) if product.history else None
    history = [
        {"recorded_at": dt.isoformat(), "price_minor": price}
        for dt, price in product.history
        if cutoff is None or dt >= cutoff
    ]
    prices = [point["price_minor"] for point in history]
    highs_lows = {
        "days_30": _window_stats(history, 30),
        "days_90": _window_stats(history, 90),
        "days_365": _window_stats(history, 365),
    }

    alternatives = [
        product_summary(other)
        for other in list_products()
        if other.category == product.category and other.slug != product.slug
    ][:4]

    return {
        "is_mock": True,
        "product": {
            **summary,
            "specs": [{"key": s.key, "value": s.value, "unit": s.unit} for s in product.specs],
        },
        "listings": [
            {
                "id": listing.id,
                "retailer": listing.retailer,
                "retailer_slug": listing.retailer_slug,
                "price_minor": listing.price_minor,
                "shipping_minor": listing.shipping_minor,
                "currency": listing.currency,
                "condition": listing.condition,
                "availability": listing.availability,
                "deal_score": listing.deal_score,
                "product_url": listing.product_url,
                "is_marketplace": listing.is_marketplace,
                "is_mock": True,
            }
            for listing in sorted(
                product.listings,
                key=lambda item: item.price_minor + (item.shipping_minor or 0),
            )
        ],
        "price_history": history,
        "stats": {
            "current_minor": int(summary["best_price_minor"]),
            "high_low": highs_lows,
            "sample_count": len(prices),
            "deal_score_reliable": summary["deal_score"] is not None,
        },
        "alternatives": alternatives,
        "affiliate_disclosure": (
            "Demo links point to example.com placeholders. "
            "When live affiliate links are enabled, disclosures will appear here."
        ),
    }


@router.get("/deals")
async def list_deals(
    category: str | None = None,
    marketplace_only: bool | None = None,
    limit: int = Query(default=20, ge=1, le=50),
) -> dict[str, object]:
    cards: list[dict[str, object]] = []
    for product in list_products():
        if category and product.category != category:
            continue
        for listing in product.listings:
            if marketplace_only is True and not listing.is_marketplace:
                continue
            if marketplace_only is False and listing.is_marketplace:
                continue
            summary = product_summary(product)
            cards.append(
                {
                    "product_id": product.id,
                    "slug": product.slug,
                    "name": product.name,
                    "brand": product.brand,
                    "category": product.category,
                    "retailer": listing.retailer,
                    "price_minor": listing.price_minor,
                    "shipping_minor": listing.shipping_minor,
                    "currency": listing.currency,
                    "deal_score": listing.deal_score,
                    "price_delta_minor": summary["price_delta_minor"],
                    "condition": listing.condition,
                    "availability": listing.availability,
                    "is_marketplace": listing.is_marketplace,
                    "is_mock": True,
                    "product_url": listing.product_url,
                }
            )

    trending = sorted(
        cards,
        key=lambda c: (c["deal_score"] is None, -(c["deal_score"] or 0)),
    )[:limit]
    largest_drops = sorted(cards, key=lambda c: int(c["price_delta_minor"]))[:limit]  # type: ignore[arg-type]
    best_scores = [c for c in trending if c["deal_score"] is not None][:limit]

    return {
        "is_mock": True,
        "trending": trending,
        "largest_drops": largest_drops,
        "best_deal_scores": best_scores,
    }


def _window_stats(history: list[dict[str, object]], days: int) -> dict[str, int | None]:
    if not history:
        return {"high_minor": None, "low_minor": None}
    slice_ = history[-days:] if len(history) >= days else history
    prices = [int(point["price_minor"]) for point in slice_]  # type: ignore[arg-type]
    return {"high_minor": max(prices), "low_minor": min(prices)}
