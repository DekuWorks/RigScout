from fastapi import APIRouter

from src import __version__
from src.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "rigscout-api",
        "version": __version__,
        "environment": settings.environment,
        "supabase_configured": settings.supabase_configured,
        "email_configured": settings.email_configured,
    }
