"""Authenticated account helpers (export support + delete)."""

from __future__ import annotations

from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, Header, HTTPException

from src.core.config import get_settings
from src.services.supabase_rest import SupabaseRest, SupabaseRestError

router = APIRouter(prefix="/v1/account", tags=["account"])


def _require_user(authorization: str | None) -> dict[str, object]:
    settings = get_settings()
    if not settings.supabase_configured:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    url = settings.supabase_url.rstrip("/") + "/auth/v1/user"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {token}",
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Auth lookup failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    data = response.json()
    if not isinstance(data, dict) or not data.get("id"):
        raise HTTPException(status_code=401, detail="Invalid session user")
    return data


@router.get("/export")
async def export_account(authorization: str | None = Header(default=None)) -> dict[str, object]:
    """Return a JSON export of the caller's RigScout data (service-role read)."""
    user = _require_user(authorization)
    user_id = str(user["id"])
    settings = get_settings()
    db = SupabaseRest(settings)

    try:
        profiles = db.get("profiles", {"select": "*", "id": f"eq.{user_id}"})
        builds = db.get(
            "builds",
            {
                "select": "*,items:build_items(*)",
                "user_id": f"eq.{user_id}",
            },
        )
        watchlists = db.get("watchlists", {"select": "*", "user_id": f"eq.{user_id}"})
        alerts = db.get("price_alerts", {"select": "*", "user_id": f"eq.{user_id}"})
        notifications = db.get("notifications", {"select": "*", "user_id": f"eq.{user_id}"})
    except SupabaseRestError as exc:
        raise HTTPException(status_code=502, detail=f"Export query failed: {exc}") from exc

    return {
        "exported_at": datetime.now(UTC).isoformat(),
        "user": {
            "id": user_id,
            "email": user.get("email"),
        },
        "profile": profiles[0] if profiles else None,
        "builds": builds,
        "watchlists": watchlists,
        "price_alerts": alerts,
        "notifications": notifications,
    }


@router.delete("")
async def delete_account(authorization: str | None = Header(default=None)) -> dict[str, object]:
    """Permanently delete the authenticated auth user (cascades owned rows)."""
    user = _require_user(authorization)
    user_id = str(user["id"])
    settings = get_settings()
    url = settings.supabase_url.rstrip("/") + f"/auth/v1/admin/users/{user_id}"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.delete(url, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Delete failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Supabase admin delete failed ({response.status_code})",
        )
    return {"deleted": True, "user_id": user_id}
