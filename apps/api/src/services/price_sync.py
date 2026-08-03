"""Ingest retailer listings + price_history via service-role PostgREST.

Live adapters (when credentials present):
  - Best Buy Remix API
  - Amazon PA-API 5 (Associates)

Feed-gated (when NEWEGG_FEED_PATH / MICROCENTER_FEED_PATH set):
  - Newegg manual/affiliate CSV/JSON (Marketplace seller API ≠ catalog search)
  - Micro Center manual CSV/JSON (no public product API)

Demo path: ``MockRetailerAdapter`` when ``allow_mock=True`` and no live keys/feeds.
"""

from __future__ import annotations

import asyncio
import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from src.adapters.base import NormalizedListing, RetailerAdapter
from src.adapters.mock import MockRetailerAdapter
from src.adapters.registry import AdapterPlan, credential_checklist, plan_adapters
from src.core.config import Settings
from src.core.deal_score import compute_deal_score
from src.services.supabase_rest import SupabaseRest, SupabaseRestError


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def product_search_query(product: dict[str, Any]) -> str:
    """Build a retailer search string from a catalog product row."""
    brand = product.get("brand")
    model = product.get("model")
    if isinstance(brand, str) and brand.strip() and isinstance(model, str) and model.strip():
        return f"{brand.strip()} {model.strip()}"
    parts: list[str] = []
    for key in ("brand", "model", "name"):
        value = product.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())
    if parts:
        return " ".join(dict.fromkeys(parts))
    return "pc components"


def score_listing_match(product: dict[str, Any], listing: NormalizedListing) -> float:
    """Higher is better. Used to pick the best retailer result for a catalog SKU."""
    score = 0.0
    name = str(product.get("name") or "").lower()
    brand = str(product.get("brand") or "").lower()
    model = str(product.get("model") or "").lower()
    title = listing.title.lower()
    listing_brand = (listing.brand or "").lower()

    if brand and listing_brand and brand == listing_brand:
        score += 3.0
    elif brand and brand in title:
        score += 2.0

    if model:
        compact_model = re.sub(r"\s+", "", model)
        compact_title = re.sub(r"\s+", "", title)
        if model in title or compact_model in compact_title:
            score += 4.0

    name_tokens = {t for t in re.split(r"[^a-z0-9]+", name) if len(t) > 2}
    title_tokens = {t for t in re.split(r"[^a-z0-9]+", title) if len(t) > 2}
    if name_tokens:
        overlap = len(name_tokens & title_tokens) / len(name_tokens)
        score += overlap * 2.0

    return score


def pick_best_listing(
    product: dict[str, Any],
    listings: list[NormalizedListing],
    *,
    min_score: float = 2.5,
) -> NormalizedListing | None:
    if not listings:
        return None
    ranked = sorted(listings, key=lambda item: score_listing_match(product, item), reverse=True)
    best = ranked[0]
    if score_listing_match(product, best) < min_score:
        return None
    return best


def _ensure_retailer(db: SupabaseRest, spec: dict[str, Any]) -> dict[str, Any]:
    rows = db.get("retailers", {"select": "*", "slug": f"eq.{spec['slug']}", "limit": "1"})
    if rows:
        return rows[0]
    created = db.post("retailers", spec)
    if not created:
        raise SupabaseRestError(f"Failed to create retailer {spec['slug']}")
    return created[0]


def _history_stats(history: list[dict[str, Any]]) -> tuple[int | None, int | None, int | None, int]:
    prices = [row["price_minor"] for row in history if isinstance(row.get("price_minor"), int)]
    if not prices:
        return None, None, None, 0
    avg_30 = int(sum(prices[:120]) / len(prices[:120]))
    avg_90 = int(sum(prices[:360]) / len(prices[:360]))
    low = min(prices)
    return avg_30, avg_90, low, len(prices)


def _compute_score(
    listing: NormalizedListing,
    history: list[dict[str, Any]],
    retailer_confidence: float,
) -> float | None:
    avg_30, avg_90, low, points = _history_stats(history)
    return compute_deal_score(
        current_price_minor=listing.price_minor,
        avg_30d_minor=avg_30,
        avg_90d_minor=avg_90,
        historical_low_minor=low,
        history_points=points,
        available=listing.availability in {"in_stock", "preorder", "unknown"},
        condition=listing.condition,
        shipping_minor=listing.shipping_minor,
        retailer_confidence=retailer_confidence,
        min_history_points=3,
    )


async def _fetch_for_product(
    adapter: RetailerAdapter,
    product: dict[str, Any],
) -> NormalizedListing | None:
    match_product = getattr(adapter, "match_product", None)
    if callable(match_product):
        exact = match_product(product)
        if exact is not None:
            return exact

    query = product_search_query(product)
    listings = await adapter.fetch_listings(query)
    if isinstance(adapter, MockRetailerAdapter):
        return pick_best_listing(product, listings, min_score=0.5)
    return pick_best_listing(product, listings)


async def _collect_listings(
    adapter: RetailerAdapter,
    products: list[dict[str, Any]],
    *,
    delay_s: float = 0.2,
) -> list[tuple[dict[str, Any], NormalizedListing]]:
    pairs: list[tuple[dict[str, Any], NormalizedListing]] = []
    for index, product in enumerate(products):
        if index and delay_s > 0 and not isinstance(adapter, MockRetailerAdapter):
            await asyncio.sleep(delay_s)
        try:
            listing = await _fetch_for_product(adapter, product)
        except Exception:
            continue
        if listing is not None:
            pairs.append((product, listing))
    return pairs


def _upsert_listing(
    db: SupabaseRest,
    *,
    product_id: str,
    retailer_id: str,
    listing: NormalizedListing,
    deal_score: float | None,
) -> dict[str, Any]:
    payload = {
        "product_id": product_id,
        "retailer_id": retailer_id,
        "source": listing.source,
        "external_listing_id": listing.external_listing_id,
        "product_url": listing.product_url,
        "title": listing.title,
        "price_minor": listing.price_minor,
        "shipping_minor": listing.shipping_minor,
        "currency": listing.currency,
        "condition": listing.condition,
        "availability": listing.availability,
        "deal_score": deal_score,
        "is_mock": listing.is_mock,
        "is_active": True,
        "source_checked_at": listing.last_checked_at.isoformat(),
    }
    rows = db.upsert("retailer_listings", payload, on_conflict="source,external_listing_id")
    if not rows:
        raise SupabaseRestError("Listing upsert returned no rows")
    return rows[0]


def _insert_history(
    db: SupabaseRest,
    *,
    listing_id: str,
    product_id: str,
    listing: NormalizedListing,
) -> None:
    db.post(
        "price_history",
        {
            "listing_id": listing_id,
            "product_id": product_id,
            "price_minor": listing.price_minor,
            "shipping_minor": listing.shipping_minor,
            "currency": listing.currency,
            "availability": listing.availability,
            "recorded_at": listing.last_checked_at.isoformat(),
            "source": listing.source,
        },
    )


async def _run_one_source(
    db: SupabaseRest,
    plan: AdapterPlan,
    products: list[dict[str, Any]],
    *,
    allow_mock: bool,
) -> dict[str, Any]:
    assert plan.adapter is not None
    adapter = plan.adapter
    source = plan.source
    run_started = _now_iso()
    sync_run_id: str | None = None
    try:
        retailer = _ensure_retailer(db, plan.retailer_spec)
        retailer_id = str(retailer["id"])
        confidence = float(retailer.get("confidence") or 0.8)
        UUID(retailer_id)  # sanity

        run_rows = db.post(
            "retailer_sync_runs",
            {
                "retailer_id": retailer_id,
                "source": source,
                "status": "running",
                "started_at": run_started,
                "metadata": {
                    "allow_mock": allow_mock,
                    "product_count": len(products),
                    "adapter": adapter.__class__.__name__,
                },
            },
        )
        sync_run_id = str(run_rows[0]["id"]) if run_rows else None

        pairs = await _collect_listings(adapter, products)
        upserted = 0
        history_inserted = 0

        for product, listing in pairs:
            product_id = str(product["id"])
            history = db.get(
                "price_history",
                {
                    "select": "price_minor,recorded_at",
                    "product_id": f"eq.{product_id}",
                    "order": "recorded_at.desc",
                    "limit": "360",
                },
            )
            deal_score = _compute_score(listing, history, confidence)
            row = _upsert_listing(
                db,
                product_id=product_id,
                retailer_id=retailer_id,
                listing=listing,
                deal_score=deal_score,
            )
            _insert_history(
                db,
                listing_id=str(row["id"]),
                product_id=product_id,
                listing=listing,
            )
            upserted += 1
            history_inserted += 1

        unmatched = max(0, len(products) - len(pairs))
        finished = _now_iso()
        if sync_run_id:
            db.patch(
                "retailer_sync_runs",
                {
                    "status": "succeeded",
                    "finished_at": finished,
                    "listings_upserted": upserted,
                    "history_inserted": history_inserted,
                    "metadata": {
                        "allow_mock": allow_mock,
                        "product_count": len(products),
                        "matched": len(pairs),
                        "unmatched": unmatched,
                        "adapter": adapter.__class__.__name__,
                    },
                },
                {"id": f"eq.{sync_run_id}"},
            )

        return {
            "source": source,
            "status": "succeeded",
            "retailer_id": retailer_id,
            "listings_upserted": upserted,
            "history_inserted": history_inserted,
            "matched": len(pairs),
            "unmatched": unmatched,
            "is_mock": bool(plan.retailer_spec.get("is_mock")),
            "sync_run_id": sync_run_id,
        }
    except Exception as exc:  # noqa: BLE001 — continue other sources
        finished = _now_iso()
        message = str(exc)
        if sync_run_id:
            try:
                db.patch(
                    "retailer_sync_runs",
                    {
                        "status": "failed",
                        "finished_at": finished,
                        "error_message": message[:2000],
                    },
                    {"id": f"eq.{sync_run_id}"},
                )
            except Exception:  # noqa: BLE001
                pass
        return {
            "source": source,
            "status": "failed",
            "error": message,
            "sync_run_id": sync_run_id,
        }
    finally:
        close = getattr(adapter, "aclose", None)
        if callable(close):
            await close()


async def run_price_sync(
    settings: Settings,
    *,
    allow_mock: bool = False,
    product_limit: int | None = None,
) -> dict[str, Any]:
    """Run ingestion for configured retailers. Service-role required."""
    if not settings.supabase_configured:
        return {
            "status": "failed",
            "error": "Supabase service role is not configured",
            "credentials_required": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
            "retailer_checklist": credential_checklist(),
        }

    plans = plan_adapters(settings, allow_mock=allow_mock)
    enabled = [p for p in plans if p.enabled and p.adapter is not None]
    disabled = [
        {
            "source": p.source,
            "status": "disabled",
            "reason": p.reason,
            "credentials_missing": list(p.credentials_missing),
        }
        for p in plans
        if not p.enabled
    ]
    credentials_missing = sorted(
        {name for p in plans for name in p.credentials_missing},
    )

    started = _now_iso()
    if not enabled:
        return {
            "status": "skipped",
            "started_at": started,
            "finished_at": _now_iso(),
            "message": (
                "No live retailer credentials or feeds configured. "
                "Set BEST_BUY_API_KEY and/or Amazon PA-API keys, and/or "
                "NEWEGG_FEED_PATH / MICROCENTER_FEED_PATH (CSV/JSON), then redeploy. "
                "Or pass allow_mock=true for demo mock ingestion."
            ),
            "credentials_missing": credentials_missing,
            "credentials_required_next": credential_checklist(),
            "disabled_sources": disabled,
            "sources": [],
        }

    db = SupabaseRest(settings)
    products = db.get(
        "products",
        {
            "select": "id,slug,name,brand,model,category",
            "is_active": "eq.true",
            "order": "category.asc,name.asc",
        },
    )
    if product_limit is not None:
        products = products[: max(0, product_limit)]

    sources_run: list[dict[str, Any]] = []
    total_upserted = 0
    total_history = 0
    errors: list[str] = []

    for plan in enabled:
        result = await _run_one_source(db, plan, products, allow_mock=allow_mock)
        sources_run.append(result)
        if result.get("status") == "succeeded":
            total_upserted += int(result.get("listings_upserted") or 0)
            total_history += int(result.get("history_inserted") or 0)
        elif result.get("error"):
            errors.append(f"{result.get('source')}: {result.get('error')}")

    any_ok = any(s.get("status") == "succeeded" for s in sources_run)
    status = "succeeded" if any_ok and not errors else ("partial" if any_ok else "failed")

    return {
        "status": status,
        "started_at": started,
        "finished_at": _now_iso(),
        "listings_upserted": total_upserted,
        "history_inserted": total_history,
        "products_considered": len(products),
        "credentials_missing": credentials_missing,
        "credentials_required_next": credential_checklist(),
        "disabled_sources": disabled,
        "sources": sources_run,
        "errors": errors[:20],
    }
