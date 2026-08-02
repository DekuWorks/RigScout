"""Internal job endpoints (token-gated)."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from src.core.config import get_settings
from src.services.alert_job import evaluate_alerts

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
