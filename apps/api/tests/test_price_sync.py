"""Price sync orchestration with mocked adapters / DB (no live network)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from unittest.mock import MagicMock

import pytest

from src.adapters.base import NormalizedListing
from src.adapters.mock import MockRetailerAdapter
from src.core.config import Settings
from src.services import price_sync


class _FakeAdapter:
    name = "bestbuy"

    def __init__(self, listings: list[NormalizedListing]) -> None:
        self._listings = listings
        self.closed = False

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        return list(self._listings)

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        for item in self._listings:
            if item.external_listing_id == external_id:
                return item
        return None

    async def aclose(self) -> None:
        self.closed = True


def _listing(*, sku: str = "6537310", title: str = "AMD Ryzen 7 7800X3D") -> NormalizedListing:
    return NormalizedListing(
        source="bestbuy",
        external_listing_id=sku,
        product_url=f"https://www.bestbuy.com/site/{sku}.p",
        title=title,
        brand="AMD",
        category="cpu",
        price_minor=34999,
        currency="USD",
        shipping_minor=None,
        condition="new",
        availability="in_stock",
        last_checked_at=datetime.now(UTC),
        is_mock=False,
    )


@pytest.mark.asyncio
async def test_run_price_sync_skipped_without_credentials() -> None:
    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="service-role",
        best_buy_api_key="",
        amazon_paapi_access_key="",
        amazon_paapi_secret_key="",
        amazon_paapi_partner_tag="",
    )
    result = await price_sync.run_price_sync(settings, allow_mock=False)
    assert result["status"] == "skipped"
    assert "BEST_BUY_API_KEY" in result["credentials_missing"]
    assert any(d["source"] == "newegg" for d in result["disabled_sources"])
    assert any(d["source"] == "microcenter" for d in result["disabled_sources"])


@pytest.mark.asyncio
async def test_run_price_sync_writes_with_mocked_plan(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="service-role",
        best_buy_api_key="bb-key",
    )
    listing = _listing()
    fake_adapter = _FakeAdapter([listing])

    class Plan:
        source = "bestbuy"
        retailer_spec = {
            "slug": "bestbuy",
            "name": "Best Buy",
            "website_url": "https://www.bestbuy.com",
            "confidence": 0.9,
            "is_marketplace": False,
            "is_mock": False,
        }
        adapter = fake_adapter
        enabled = True
        reason = None
        credentials_missing: tuple[str, ...] = ()

    disabled_plan = MagicMock(
        source="newegg",
        enabled=False,
        reason="stub",
        credentials_missing=(),
        adapter=None,
    )

    monkeypatch.setattr(
        price_sync,
        "plan_adapters",
        lambda _settings, allow_mock=False: [Plan(), disabled_plan],
    )

    calls: dict[str, Any] = {"posts": [], "upserts": [], "patches": []}

    class FakeDB:
        def get(self, path: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
            if path == "products":
                return [
                    {
                        "id": "b0000001-0000-4000-8000-000000000001",
                        "slug": "amd-ryzen-7-7800x3d",
                        "name": "AMD Ryzen 7 7800X3D",
                        "brand": "AMD",
                        "model": "7800X3D",
                        "category": "cpu",
                    }
                ]
            if path == "retailers":
                return [
                    {
                        "id": "a0000001-0000-4000-8000-000000000099",
                        "slug": "bestbuy",
                        "confidence": 0.9,
                    }
                ]
            if path == "price_history":
                return [{"price_minor": 36000}, {"price_minor": 37000}, {"price_minor": 38000}]
            return []

        def post(self, path: str, payload: Any, **_kwargs: Any) -> list[dict[str, Any]]:
            calls["posts"].append((path, payload))
            if path == "retailer_sync_runs":
                return [{"id": "d0000001-0000-4000-8000-000000000001"}]
            if path == "price_history":
                return [{"id": "hist-1"}]
            return [{"id": "row-1"}]

        def upsert(self, path: str, payload: Any, *, on_conflict: str) -> list[dict[str, Any]]:
            calls["upserts"].append((path, payload, on_conflict))
            return [{"id": "c0000001-0000-4000-8000-000000000099", **payload}]

        def patch(self, path: str, payload: dict[str, Any], params: dict[str, str] | None = None) -> list:
            calls["patches"].append((path, payload, params))
            return [{"id": "d0000001-0000-4000-8000-000000000001"}]

    monkeypatch.setattr(price_sync, "SupabaseRest", lambda _settings: FakeDB())

    result = await price_sync.run_price_sync(settings, allow_mock=False)
    assert result["status"] == "succeeded"
    assert result["listings_upserted"] == 1
    assert result["history_inserted"] == 1
    assert calls["upserts"][0][0] == "retailer_listings"
    assert calls["upserts"][0][1]["source"] == "bestbuy"
    assert any(path == "price_history" for path, _ in calls["posts"])
    assert fake_adapter.closed is True


@pytest.mark.asyncio
async def test_allow_mock_uses_mock_adapter(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="service-role",
    )
    seen: list[str] = []

    async def fake_run_one(db: Any, plan: Any, products: list, *, allow_mock: bool) -> dict[str, Any]:
        seen.append(plan.source)
        assert isinstance(plan.adapter, MockRetailerAdapter)
        return {
            "source": plan.source,
            "status": "succeeded",
            "listings_upserted": 0,
            "history_inserted": 0,
        }

    monkeypatch.setattr(price_sync, "_run_one_source", fake_run_one)
    monkeypatch.setattr(
        price_sync,
        "SupabaseRest",
        lambda _s: MagicMock(get=lambda *_a, **_k: []),
    )

    result = await price_sync.run_price_sync(settings, allow_mock=True)
    assert result["status"] == "succeeded"
    assert seen == ["mock_retailer"]
