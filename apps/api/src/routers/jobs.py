"""Internal job endpoints (token-gated)."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query

from src.core.config import get_settings
from src.services.alert_job import evaluate_alerts
from src.services.price_sync import run_price_sync

router = APIRouter(prefix="/v1/jobs", tags=["jobs"])


def _require_job_token(x_job_token: str | None) -> None:
    settings = get_settings()
    if not settings.jobs_enabled:
        raise HTTPException(
            status_code=503,
            detail="Job routes disabled. Set ALERT_JOB_TOKEN to enable.",
        )
    if not x_job_token or x_job_token != settings.alert_job_token:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Job-Token")


@router.post("/evaluate-alerts")
async def evaluate_alerts_job(
    x_job_token: str | None = Header(default=None, alias="X-Job-Token"),
) -> dict[str, object]:
    _require_job_token(x_job_token)
    settings = get_settings()
    if not settings.supabase_configured:
        raise HTTPException(status_code=503, detail="Supabase service role is not configured")
    return evaluate_alerts(settings)


@router.post("/sync-prices")
async def sync_prices_job(
    x_job_token: str | None = Header(default=None, alias="X-Job-Token"),
    allow_mock: bool = Query(
        default=False,
        description="When true, ingest MockRetailerAdapter if no live retailer keys are set",
    ),
    limit: int | None = Query(
        default=None,
        ge=1,
        le=500,
        description="Optional cap on catalog products to match",
    ),
) -> dict[str, object]:
    """Ingest retailer listings + price_history (service role).

    Live sync when credentials are present:
    - Best Buy: ``BEST_BUY_API_KEY``
    - Amazon PA-API: ``AMAZON_PAAPI_ACCESS_KEY``, ``AMAZON_PAAPI_SECRET_KEY``,
      ``AMAZON_PAAPI_PARTNER_TAG``

    Newegg / Micro Center are stubs (no public catalog API; no scraping).
    Without live credentials the job returns ``status=skipped`` unless ``allow_mock=true``.
    """
    _require_job_token(x_job_token)
    settings = get_settings()
    if not settings.supabase_configured:
        raise HTTPException(status_code=503, detail="Supabase service role is not configured")
    return await run_price_sync(settings, allow_mock=allow_mock, product_limit=limit)
