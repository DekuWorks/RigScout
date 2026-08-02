"""Best Buy adapter normalization + search query helpers (no live network)."""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from src.adapters.bestbuy import (
    BestBuyAdapter,
    build_search_query,
    dollars_to_minor,
    map_availability,
    normalize_bestbuy_product,
)
from src.services.price_sync import pick_best_listing, product_search_query, score_listing_match

FIXTURE = Path(__file__).parent / "fixtures" / "bestbuy_products_search.json"


def test_dollars_to_minor() -> None:
    assert dollars_to_minor(349.99) == 34999
    assert dollars_to_minor("12.50") == 1250
    assert dollars_to_minor(None) is None
    assert dollars_to_minor(-1) is None


def test_map_availability() -> None:
    assert map_availability({"onlineAvailability": True}) == "in_stock"
    assert map_availability({"onlineAvailability": False}) == "out_of_stock"
    assert map_availability({"orderable": "PreOrder"}) == "preorder"


def test_normalize_fixture_product() -> None:
    payload = json.loads(FIXTURE.read_text())
    listing = normalize_bestbuy_product(payload["products"][0])
    assert listing is not None
    assert listing.source == "bestbuy"
    assert listing.external_listing_id == "6537310"
    assert listing.price_minor == 34999
    assert listing.is_mock is False
    assert listing.availability == "in_stock"
    assert listing.brand == "AMD"
    assert "7800X3D" in listing.title


def test_build_search_query_ands_tokens() -> None:
    q = build_search_query("AMD 7800X3D")
    assert "search=AMD" in q
    assert "search=7800X3D" in q
    assert "&" in q


def test_product_search_query_prefers_brand_model() -> None:
    assert (
        product_search_query({"brand": "AMD", "model": "7800X3D", "name": "AMD Ryzen 7 7800X3D"})
        == "AMD 7800X3D"
    )


def test_pick_best_listing_from_fixture() -> None:
    payload = json.loads(FIXTURE.read_text())
    listings = [normalize_bestbuy_product(p) for p in payload["products"]]
    listings = [item for item in listings if item is not None]
    product = {
        "name": "AMD Ryzen 7 7800X3D",
        "brand": "AMD",
        "model": "7800X3D",
    }
    best = pick_best_listing(product, listings)
    assert best is not None
    assert best.external_listing_id == "6537310"
    assert score_listing_match(product, best) >= 2.5


@pytest.mark.asyncio
async def test_fetch_listings_uses_fixture_transport() -> None:
    payload = FIXTURE.read_text()

    def handler(request: httpx.Request) -> httpx.Response:
        assert "apiKey=test-key" in str(request.url)
        assert "products(" in str(request.url)
        return httpx.Response(200, text=payload, headers={"Content-Type": "application/json"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        adapter = BestBuyAdapter("test-key", client=client, base_url="https://api.bestbuy.com/v1")
        listings = await adapter.fetch_listings("AMD 7800X3D")
    assert len(listings) == 2
    assert listings[0].price_minor == 34999
    assert listings[1].availability == "out_of_stock"


@pytest.mark.asyncio
async def test_fetch_listing_by_sku() -> None:
    product = json.loads(FIXTURE.read_text())["products"][0]

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/products/6537310.json")
        return httpx.Response(200, json=product)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        adapter = BestBuyAdapter("test-key", client=client)
        listing = await adapter.fetch_listing("6537310")
    assert listing is not None
    assert listing.external_listing_id == "6537310"
