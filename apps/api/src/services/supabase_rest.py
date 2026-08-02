"""Minimal Supabase PostgREST client using the service-role key."""

from __future__ import annotations

from typing import Any

import httpx

from src.core.config import Settings


class SupabaseRestError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class SupabaseRest:
    def __init__(self, settings: Settings) -> None:
        if not settings.supabase_configured:
            raise SupabaseRestError("Supabase is not configured")
        self._base = settings.supabase_url.rstrip("/") + "/rest/v1"
        self._headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def get(self, path: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{self._base}/{path.lstrip('/')}",
                headers=self._headers,
                params=params,
            )
        if response.status_code >= 400:
            raise SupabaseRestError(response.text, response.status_code)
        data = response.json()
        return data if isinstance(data, list) else [data]

    def post(
        self,
        path: str,
        payload: dict[str, Any] | list[dict[str, Any]],
        *,
        prefer: str | None = None,
        params: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{self._base}/{path.lstrip('/')}",
                headers=headers,
                params=params,
                json=payload,
            )
        if response.status_code >= 400:
            raise SupabaseRestError(response.text, response.status_code)
        if not response.content:
            return []
        data = response.json()
        return data if isinstance(data, list) else [data]

    def upsert(
        self,
        path: str,
        payload: dict[str, Any] | list[dict[str, Any]],
        *,
        on_conflict: str,
    ) -> list[dict[str, Any]]:
        """Insert or update on unique conflict (service-role writes)."""
        return self.post(
            path,
            payload,
            prefer="resolution=merge-duplicates,return=representation",
            params={"on_conflict": on_conflict},
        )

    def patch(
        self,
        path: str,
        payload: dict[str, Any],
        params: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        with httpx.Client(timeout=30.0) as client:
            response = client.patch(
                f"{self._base}/{path.lstrip('/')}",
                headers=self._headers,
                params=params,
                json=payload,
            )
        if response.status_code >= 400:
            raise SupabaseRestError(response.text, response.status_code)
        if not response.content:
            return []
        data = response.json()
        return data if isinstance(data, list) else [data]
