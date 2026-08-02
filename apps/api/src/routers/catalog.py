from fastapi import APIRouter, Query

from src.adapters.mock import MockRetailerAdapter

router = APIRouter(prefix="/v1", tags=["catalog"])


@router.get("/listings")
async def list_mock_listings(q: str | None = Query(default=None)) -> dict[str, object]:
    """Demo listings from the mock retailer adapter (Phase 1)."""
    adapter = MockRetailerAdapter()
    listings = await adapter.fetch_listings(q)
    return {
        "source": adapter.name,
        "is_mock": True,
        "count": len(listings),
        "items": [
            {
                "external_listing_id": item.external_listing_id,
                "title": item.title,
                "brand": item.brand,
                "category": item.category,
                "price_minor": item.price_minor,
                "currency": item.currency,
                "shipping_minor": item.shipping_minor,
                "condition": item.condition,
                "availability": item.availability,
                "product_url": item.product_url,
                "is_mock": item.is_mock,
                "last_checked_at": item.last_checked_at.isoformat(),
            }
            for item in listings
        ],
    }
