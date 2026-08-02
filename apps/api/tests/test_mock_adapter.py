import pytest

from src.adapters.mock import MockRetailerAdapter


@pytest.mark.asyncio
async def test_mock_listings_labeled() -> None:
    adapter = MockRetailerAdapter()
    listings = await adapter.fetch_listings()
    assert len(listings) >= 2
    assert all(item.is_mock for item in listings)
    assert all(item.source == "mock_retailer" for item in listings)


@pytest.mark.asyncio
async def test_mock_query_filter() -> None:
    adapter = MockRetailerAdapter()
    listings = await adapter.fetch_listings("4070")
    assert len(listings) == 1
    assert "4070" in listings[0].title
