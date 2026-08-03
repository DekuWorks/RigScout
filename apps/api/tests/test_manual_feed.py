"""Manual CSV/JSON feed parsing + feed-gated Newegg/Micro Center adapters."""

from __future__ import annotations

from pathlib import Path

import pytest

from src.adapters.manual_feed import ManualFeedAdapter, parse_feed_text
from src.adapters.microcenter import MicroCenterAdapter, MicroCenterAdapterNotConfigured
from src.adapters.newegg import NeweggAdapter, NeweggAdapterNotConfigured
from src.adapters.registry import plan_adapters
from src.core.config import Settings

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_newegg_csv_fixture() -> None:
    text = (FIXTURES / "newegg_feed.csv").read_text()
    rows = parse_feed_text(text, source="newegg", fmt="csv")
    assert len(rows) == 2
    assert rows[0].listing.source == "newegg"
    assert rows[0].listing.price_minor == 34999
    assert rows[0].product_slug == "amd-ryzen-7-7800x3d"
    assert rows[0].listing.is_mock is False


def test_parse_microcenter_json_fixture() -> None:
    text = (FIXTURES / "microcenter_feed.json").read_text()
    rows = parse_feed_text(text, source="microcenter", fmt="json")
    assert len(rows) == 1
    assert rows[0].listing.price_minor == 32999
    assert rows[0].listing.external_listing_id == "654321"


@pytest.mark.asyncio
async def test_newegg_stub_without_feed() -> None:
    adapter = NeweggAdapter(api_key="seller-key", seller_id="ABC")
    assert adapter.is_live_ready is False
    with pytest.raises(NeweggAdapterNotConfigured):
        await adapter.fetch_listings("7800X3D")


@pytest.mark.asyncio
async def test_newegg_feed_adapter_reads_csv() -> None:
    path = str(FIXTURES / "newegg_feed.csv")
    adapter = NeweggAdapter(feed_path=path)
    assert adapter.is_live_ready is True
    listings = await adapter.fetch_listings("7800X3D")
    assert any("7800X3D" in item.title for item in listings)
    matched = adapter.match_product(
        {"id": "x", "slug": "amd-ryzen-7-7800x3d", "name": "AMD Ryzen 7 7800X3D"}
    )
    assert matched is not None
    assert matched.external_listing_id == "N82E16819113780"


@pytest.mark.asyncio
async def test_microcenter_feed_adapter_reads_json() -> None:
    path = str(FIXTURES / "microcenter_feed.json")
    adapter = MicroCenterAdapter(feed_path=path)
    listing = await adapter.fetch_listing("654321")
    assert listing is not None
    assert listing.price_minor == 32999


@pytest.mark.asyncio
async def test_microcenter_stub_without_feed() -> None:
    adapter = MicroCenterAdapter()
    with pytest.raises(MicroCenterAdapterNotConfigured):
        await adapter.fetch_listing("12345")


def test_registry_enables_feeds_when_paths_set() -> None:
    settings = Settings(
        best_buy_api_key="",
        amazon_paapi_access_key="",
        amazon_paapi_secret_key="",
        amazon_paapi_partner_tag="",
        newegg_feed_path=str(FIXTURES / "newegg_feed.csv"),
        microcenter_feed_path=str(FIXTURES / "microcenter_feed.json"),
    )
    plans = plan_adapters(settings, allow_mock=False)
    enabled = {p.source for p in plans if p.enabled}
    assert enabled == {"newegg", "microcenter"}


def test_manual_feed_adapter_direct() -> None:
    adapter = ManualFeedAdapter("newegg", str(FIXTURES / "newegg_feed.csv"))
    assert adapter.is_live_ready is True
