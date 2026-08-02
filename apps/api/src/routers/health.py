from fastapi import APIRouter

from src import __version__
from src.core.config import get_settings
from src.services.catalog_store import get_catalog_snapshot

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, object]:
    settings = get_settings()
    catalog = get_catalog_snapshot(settings)
    return {
        "status": "ok",
        "service": "rigscout-api",
        "version": __version__,
        "environment": settings.environment,
        "supabase_configured": settings.supabase_configured,
        "email_configured": settings.email_configured,
        "catalog_source": catalog.source,
        "catalog_is_mock": catalog.is_mock,
        "catalog_product_count": len(catalog.products),
    }
