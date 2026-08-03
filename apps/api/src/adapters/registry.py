"""Retailer adapter registry — credential / feed detection + honest disabled reasons."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from src.adapters.amazon_paapi import AmazonPaapiAdapter
from src.adapters.base import RetailerAdapter
from src.adapters.bestbuy import BestBuyAdapter
from src.adapters.microcenter import MicroCenterAdapter
from src.adapters.mock import MockRetailerAdapter
from src.adapters.newegg import NeweggAdapter
from src.core.config import Settings

RETAILER_SPECS: dict[str, dict[str, Any]] = {
    "bestbuy": {
        "slug": "bestbuy",
        "name": "Best Buy",
        "website_url": "https://www.bestbuy.com",
        "confidence": 0.90,
        "is_marketplace": False,
        "is_mock": False,
    },
    "amazon": {
        "slug": "amazon",
        "name": "Amazon",
        "website_url": "https://www.amazon.com",
        "confidence": 0.88,
        "is_marketplace": True,
        "is_mock": False,
    },
    "newegg": {
        "slug": "newegg",
        "name": "Newegg",
        "website_url": "https://www.newegg.com",
        "confidence": 0.85,
        "is_marketplace": True,
        "is_mock": False,
    },
    "microcenter": {
        "slug": "microcenter",
        "name": "Micro Center",
        "website_url": "https://www.microcenter.com",
        "confidence": 0.87,
        "is_marketplace": False,
        "is_mock": False,
    },
    "mock_retailer": {
        "slug": "mock-retailer",
        "name": "Mock Retailer (demo)",
        "website_url": "https://example.com/mock-retailer",
        "confidence": 0.50,
        "is_marketplace": False,
        "is_mock": True,
    },
}


@dataclass(frozen=True)
class AdapterPlan:
    """One retailer slot for the sync job."""

    source: str
    retailer_spec: dict[str, Any]
    adapter: RetailerAdapter | None
    enabled: bool
    reason: str | None = None
    credentials_missing: tuple[str, ...] = ()


def credential_checklist() -> list[dict[str, Any]]:
    """Human-facing checklist used by dry-run / skipped sync responses."""
    return [
        {
            "source": "bestbuy",
            "status": "live_when_configured",
            "env": ["BEST_BUY_API_KEY"],
            "signup": "https://developer.bestbuy.com/",
            "docs": "https://bestbuyapis.github.io/api-documentation/",
        },
        {
            "source": "amazon",
            "status": "live_when_configured",
            "env": [
                "AMAZON_PAAPI_ACCESS_KEY",
                "AMAZON_PAAPI_SECRET_KEY",
                "AMAZON_PAAPI_PARTNER_TAG",
            ],
            "signup": "https://affiliate-program.amazon.com/",
            "docs": "https://webservices.amazon.com/paapi5/documentation/",
            "notes": (
                "Join Amazon Associates, then request Product Advertising / Creators API access. "
                "PA-API 5 is deprecated in favour of Creators API; this adapter speaks PA-API 5 "
                "SigV4 and surfaces deprecation errors clearly."
            ),
        },
        {
            "source": "newegg",
            "status": "feed_when_configured",
            "env": ["NEWEGG_FEED_PATH"],
            "signup": "https://developer.newegg.com/",
            "docs": "https://developer.newegg.com/newegg_marketplace_api/",
            "notes": (
                "Marketplace API is seller-only (inventory/orders). No public catalog search. "
                "Optional NEWEGG_API_KEY / NEWEGG_SELLER_ID do not enable RigScout ingestion. "
                "Set NEWEGG_FEED_PATH to a CSV/JSON file or URL (affiliate export or manual). "
                "See docs/feeds/ and docs/RETAILER_ADAPTERS.md."
            ),
        },
        {
            "source": "microcenter",
            "status": "feed_when_configured",
            "env": ["MICROCENTER_FEED_PATH"],
            "signup": None,
            "docs": "https://www.microcenter.com/",
            "notes": (
                "No public product API and no public affiliate product feed. "
                "Set MICROCENTER_FEED_PATH to a CSV/JSON file or URL. No scraping."
            ),
        },
    ]


def plan_adapters(settings: Settings, *, allow_mock: bool = False) -> list[AdapterPlan]:
    """Decide which adapters run and which stay disabled (honest reasons)."""
    plans: list[AdapterPlan] = []

    if settings.best_buy_configured:
        plans.append(
            AdapterPlan(
                source="bestbuy",
                retailer_spec=RETAILER_SPECS["bestbuy"],
                adapter=BestBuyAdapter(settings.best_buy_api_key),
                enabled=True,
            )
        )
    else:
        plans.append(
            AdapterPlan(
                source="bestbuy",
                retailer_spec=RETAILER_SPECS["bestbuy"],
                adapter=None,
                enabled=False,
                reason="BEST_BUY_API_KEY not set",
                credentials_missing=("BEST_BUY_API_KEY",),
            )
        )

    if settings.amazon_paapi_configured:
        plans.append(
            AdapterPlan(
                source="amazon",
                retailer_spec=RETAILER_SPECS["amazon"],
                adapter=AmazonPaapiAdapter(
                    settings.amazon_paapi_access_key,
                    settings.amazon_paapi_secret_key,
                    settings.amazon_paapi_partner_tag,
                ),
                enabled=True,
            )
        )
    else:
        missing = []
        if not settings.amazon_paapi_access_key.strip():
            missing.append("AMAZON_PAAPI_ACCESS_KEY")
        if not settings.amazon_paapi_secret_key.strip():
            missing.append("AMAZON_PAAPI_SECRET_KEY")
        if not settings.amazon_paapi_partner_tag.strip():
            missing.append("AMAZON_PAAPI_PARTNER_TAG")
        plans.append(
            AdapterPlan(
                source="amazon",
                retailer_spec=RETAILER_SPECS["amazon"],
                adapter=None,
                enabled=False,
                reason="Amazon PA-API credentials incomplete",
                credentials_missing=tuple(missing),
            )
        )

    newegg = NeweggAdapter(
        api_key=settings.newegg_api_key or None,
        seller_id=settings.newegg_seller_id or None,
        feed_path=settings.newegg_feed_path or None,
    )
    if newegg.is_live_ready:
        plans.append(
            AdapterPlan(
                source="newegg",
                retailer_spec=RETAILER_SPECS["newegg"],
                adapter=newegg,
                enabled=True,
                reason=newegg.reason,
            )
        )
    else:
        plans.append(
            AdapterPlan(
                source="newegg",
                retailer_spec=RETAILER_SPECS["newegg"],
                adapter=newegg,
                enabled=False,
                reason=newegg.reason,
                credentials_missing=("NEWEGG_FEED_PATH",),
            )
        )

    micro = MicroCenterAdapter(feed_path=settings.microcenter_feed_path or None)
    if micro.is_live_ready:
        plans.append(
            AdapterPlan(
                source="microcenter",
                retailer_spec=RETAILER_SPECS["microcenter"],
                adapter=micro,
                enabled=True,
                reason=micro.reason,
            )
        )
    else:
        plans.append(
            AdapterPlan(
                source="microcenter",
                retailer_spec=RETAILER_SPECS["microcenter"],
                adapter=micro,
                enabled=False,
                reason=micro.reason,
                credentials_missing=("MICROCENTER_FEED_PATH",),
            )
        )

    if allow_mock and not any(p.enabled for p in plans):
        plans.append(
            AdapterPlan(
                source="mock_retailer",
                retailer_spec=RETAILER_SPECS["mock_retailer"],
                adapter=MockRetailerAdapter(),
                enabled=True,
                reason="Demo mock path (allow_mock=true; no live retailer keys)",
            )
        )

    return plans
