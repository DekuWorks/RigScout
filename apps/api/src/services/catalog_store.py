"""Catalog resolution: Supabase only. Empty catalog when unseeded (no demo fallback)."""

from __future__ import annotations

import time
from dataclasses import dataclass

from src.core.config import Settings, get_settings
from src.services.demo_catalog import DemoProduct
from src.services.supabase_catalog import load_products_from_supabase

# Short TTL keeps Discover/Deals snappy without hammering PostgREST.
_CACHE_TTL_SECONDS = 45.0


@dataclass(frozen=True)
class CatalogSnapshot:
    products: list[DemoProduct]
    is_mock: bool
    source: str


_cache: CatalogSnapshot | None = None
_cache_expires_at = 0.0


def clear_catalog_cache() -> None:
    global _cache, _cache_expires_at
    _cache = None
    _cache_expires_at = 0.0


def get_catalog_snapshot(settings: Settings | None = None) -> CatalogSnapshot:
    global _cache, _cache_expires_at
    now = time.monotonic()
    if _cache is not None and now < _cache_expires_at:
        return _cache

    cfg = settings or get_settings()
    remote = load_products_from_supabase(cfg)
    if remote:
        snapshot = CatalogSnapshot(products=remote, is_mock=False, source="supabase")
    elif cfg.supabase_configured:
        # Connected but no products yet — honest empty catalog (not demo data).
        snapshot = CatalogSnapshot(products=[], is_mock=False, source="supabase")
    else:
        snapshot = CatalogSnapshot(products=[], is_mock=False, source="empty")

    _cache = snapshot
    _cache_expires_at = now + _CACHE_TTL_SECONDS
    return snapshot


def list_catalog_products(settings: Settings | None = None) -> list[DemoProduct]:
    return list(get_catalog_snapshot(settings).products)


def get_catalog_product(slug_or_id: str, settings: Settings | None = None) -> DemoProduct | None:
    snapshot = get_catalog_snapshot(settings)
    for product in snapshot.products:
        if product.slug == slug_or_id or product.id == slug_or_id:
            return product
    return None
