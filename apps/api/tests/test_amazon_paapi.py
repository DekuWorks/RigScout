"""Amazon PA-API adapter — normalization + SigV4 + mocked HTTP (no live network)."""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from src.adapters.amazon_paapi import (
    AmazonPaapiAdapter,
    normalize_paapi_item,
    sign_aws_v4,
)
from src.services.price_sync import pick_best_listing

FIXTURE = Path(__file__).parent / "fixtures" / "amazon_paapi_search.json"


def test_sign_aws_v4_is_deterministic() -> None:
    payload = b'{"Keywords":"test"}'
    headers = sign_aws_v4(
        method="POST",
        host="webservices.amazon.com",
        path="/paapi5/searchitems",
        payload=payload,
        access_key="AKIAEXAMPLE",
        secret_key="secret/example",
        amz_date="20260802T120000Z",
        amz_target="com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    )
    assert headers["Authorization"].startswith("AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE/")
    assert "Signature=" in headers["Authorization"]
    assert headers["x-amz-date"] == "20260802T120000Z"
    # Same inputs → same signature
    again = sign_aws_v4(
        method="POST",
        host="webservices.amazon.com",
        path="/paapi5/searchitems",
        payload=payload,
        access_key="AKIAEXAMPLE",
        secret_key="secret/example",
        amz_date="20260802T120000Z",
        amz_target="com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    )
    assert again["Authorization"] == headers["Authorization"]


def test_normalize_paapi_fixture() -> None:
    payload = json.loads(FIXTURE.read_text())
    item = payload["SearchResult"]["Items"][0]
    listing = normalize_paapi_item(item)
    assert listing is not None
    assert listing.source == "amazon"
    assert listing.external_listing_id == "B0BTZ2N4TX"
    assert listing.price_minor == 35900
    assert listing.shipping_minor == 0
    assert listing.availability == "in_stock"
    assert listing.is_mock is False
    assert listing.brand == "AMD"


def test_pick_best_amazon_listing() -> None:
    payload = json.loads(FIXTURE.read_text())
    listings = [
        normalize_paapi_item(item) for item in payload["SearchResult"]["Items"]
    ]
    listings = [item for item in listings if item is not None]
    best = pick_best_listing(
        {"name": "AMD Ryzen 7 7800X3D", "brand": "AMD", "model": "7800X3D"},
        listings,
    )
    assert best is not None
    assert best.external_listing_id == "B0BTZ2N4TX"


@pytest.mark.asyncio
async def test_fetch_listings_mocked() -> None:
    payload = FIXTURE.read_text()

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path == "/paapi5/searchitems"
        assert "Authorization" in request.headers
        return httpx.Response(200, text=payload, headers={"Content-Type": "application/json"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        adapter = AmazonPaapiAdapter(
            "AKIAEXAMPLE",
            "secret",
            "rigscout-20",
            client=client,
        )
        listings = await adapter.fetch_listings("AMD 7800X3D")
    assert len(listings) == 2
    assert listings[0].price_minor == 35900


@pytest.mark.asyncio
async def test_fetch_listings_surfaces_deprecation() -> None:
    body = {
        "Errors": [
            {
                "Code": "AccessDenied",
                "Message": "Product Advertising API is deprecated. Please migrate to Creators API.",
            }
        ]
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json=body)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        adapter = AmazonPaapiAdapter("AKIAEXAMPLE", "secret", "rigscout-20", client=client)
        with pytest.raises(Exception) as exc:
            await adapter.fetch_listings("AMD 7800X3D")
    assert "Creators API" in str(exc.value)
