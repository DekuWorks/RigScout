"""Newegg / Micro Center stubs must refuse fetches (no scraping)."""

from __future__ import annotations

import pytest

from src.adapters.microcenter import MicroCenterAdapter, MicroCenterAdapterNotConfigured
from src.adapters.newegg import NeweggAdapter, NeweggAdapterNotConfigured
from src.adapters.registry import plan_adapters
from src.core.config import Settings


@pytest.mark.asyncio
async def test_newegg_stub_refuses_fetch() -> None:
    adapter = NeweggAdapter(api_key="seller-key", seller_id="ABC")
    assert adapter.is_live_ready is False
    with pytest.raises(NeweggAdapterNotConfigured):
        await adapter.fetch_listings("7800X3D")


@pytest.mark.asyncio
async def test_microcenter_stub_refuses_fetch() -> None:
    adapter = MicroCenterAdapter()
    assert adapter.is_live_ready is False
    with pytest.raises(MicroCenterAdapterNotConfigured):
        await adapter.fetch_listing("12345")


def test_registry_disables_stubs_even_with_newegg_keys() -> None:
    settings = Settings(
        best_buy_api_key="",
        amazon_paapi_access_key="",
        amazon_paapi_secret_key="",
        amazon_paapi_partner_tag="",
        newegg_api_key="seller-secret",
        newegg_seller_id="NE123",
    )
    plans = plan_adapters(settings, allow_mock=False)
    by_source = {p.source: p for p in plans}
    assert by_source["newegg"].enabled is False
    assert by_source["microcenter"].enabled is False
    assert by_source["bestbuy"].enabled is False
    assert by_source["amazon"].enabled is False


def test_registry_enables_bestbuy_and_amazon_when_configured() -> None:
    settings = Settings(
        best_buy_api_key="bb-key",
        amazon_paapi_access_key="AKIA",
        amazon_paapi_secret_key="secret",
        amazon_paapi_partner_tag="tag-20",
    )
    plans = plan_adapters(settings, allow_mock=False)
    enabled = {p.source for p in plans if p.enabled}
    assert enabled == {"bestbuy", "amazon"}
