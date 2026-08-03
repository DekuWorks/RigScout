"""Direct CSV/JSON feed import for Newegg / Micro Center (service-role writes).

Prefer ``run_price_sync`` when feeds are configured via env — it uses the same
adapters. This module supports one-shot CLI/job imports against an explicit path.
Rows must include ``product_slug`` or ``product_id`` matching an active catalog product.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from src.adapters.manual_feed import FEED_SOURCES, FeedRow, load_feed_rows
from src.adapters.registry import RETAILER_SPECS
from src.core.config import Settings
from src.services.price_sync import (
    _compute_score,
    _ensure_retailer,
    _insert_history,
    _upsert_listing,
)
from src.services.supabase_rest import SupabaseRest


def resolve_feed_location(settings: Settings, source: str, path: str | None = None) -> str:
    if path and path.strip():
        return path.strip()
    if source == "newegg":
        loc = settings.newegg_feed_path.strip()
    elif source == "microcenter":
        loc = settings.microcenter_feed_path.strip()
    else:
        raise ValueError(f"Unsupported feed source '{source}'")
    if not loc:
        raise ValueError(
            f"No feed path for {source}. Pass --path or set "
            f"{'NEWEGG_FEED_PATH' if source == 'newegg' else 'MICROCENTER_FEED_PATH'}."
        )
    return loc


def _resolve_product(
    row: FeedRow,
    products_by_id: dict[str, dict[str, Any]],
    products_by_slug: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    if row.product_id and row.product_id in products_by_id:
        return products_by_id[row.product_id]
    if row.product_slug:
        return products_by_slug.get(row.product_slug.lower())
    return None


async def import_retailer_feed(
    settings: Settings,
    *,
    source: str,
    path: str | None = None,
) -> dict[str, Any]:
    """Parse a feed and upsert matching retailer_listings + price_history."""
    if source not in FEED_SOURCES:
        return {
            "status": "failed",
            "error": f"Unsupported source '{source}'. Allowed: {sorted(FEED_SOURCES)}",
        }
    if not settings.supabase_configured:
        return {
            "status": "failed",
            "error": "Supabase service role is not configured",
            "credentials_required": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        }

    try:
        location = resolve_feed_location(settings, source, path)
        rows = load_feed_rows(location, source=source)
    except Exception as exc:  # noqa: BLE001
        return {"status": "failed", "source": source, "error": str(exc)}

    db = SupabaseRest(settings)
    spec = RETAILER_SPECS[source]
    retailer = _ensure_retailer(db, spec)
    retailer_id = str(retailer["id"])
    UUID(retailer_id)
    confidence = float(retailer.get("confidence") or 0.8)

    products = db.get(
        "products",
        {
            "select": "id,slug,name,brand,model,category",
            "is_active": "eq.true",
        },
    )
    products_by_id = {str(p["id"]): p for p in products}
    products_by_slug = {
        str(p["slug"]).lower(): p for p in products if isinstance(p.get("slug"), str)
    }

    started = datetime.now(UTC).isoformat()
    run_rows = db.post(
        "retailer_sync_runs",
        {
            "retailer_id": retailer_id,
            "source": source,
            "status": "running",
            "started_at": started,
            "metadata": {
                "mode": "manual_feed_import",
                "feed_location": location,
                "feed_rows": len(rows),
            },
        },
    )
    sync_run_id = str(run_rows[0]["id"]) if run_rows else None

    upserted = 0
    history_inserted = 0
    unmatched = 0

    try:
        for row in rows:
            product = _resolve_product(row, products_by_id, products_by_slug)
            if product is None:
                unmatched += 1
                continue
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
            deal_score = _compute_score(row.listing, history, confidence)
            listing_row = _upsert_listing(
                db,
                product_id=product_id,
                retailer_id=retailer_id,
                listing=row.listing,
                deal_score=deal_score,
            )
            _insert_history(
                db,
                listing_id=str(listing_row["id"]),
                product_id=product_id,
                listing=row.listing,
            )
            upserted += 1
            history_inserted += 1

        finished = datetime.now(UTC).isoformat()
        if sync_run_id:
            db.patch(
                "retailer_sync_runs",
                {
                    "status": "succeeded",
                    "finished_at": finished,
                    "listings_upserted": upserted,
                    "history_inserted": history_inserted,
                    "metadata": {
                        "mode": "manual_feed_import",
                        "feed_location": location,
                        "feed_rows": len(rows),
                        "matched": upserted,
                        "unmatched": unmatched,
                    },
                },
                {"id": f"eq.{sync_run_id}"},
            )

        return {
            "status": "succeeded",
            "source": source,
            "feed_location": location,
            "feed_rows": len(rows),
            "listings_upserted": upserted,
            "history_inserted": history_inserted,
            "unmatched": unmatched,
            "retailer_id": retailer_id,
            "sync_run_id": sync_run_id,
            "note": (
                "Rows need product_slug or product_id matching an active catalog product. "
                "Title-only rows are ignored by import-feed; use sync-prices for fuzzy match."
            ),
        }
    except Exception as exc:  # noqa: BLE001
        finished = datetime.now(UTC).isoformat()
        if sync_run_id:
            try:
                db.patch(
                    "retailer_sync_runs",
                    {
                        "status": "failed",
                        "finished_at": finished,
                        "error_message": str(exc)[:2000],
                    },
                    {"id": f"eq.{sync_run_id}"},
                )
            except Exception:  # noqa: BLE001
                pass
        return {
            "status": "failed",
            "source": source,
            "error": str(exc),
            "sync_run_id": sync_run_id,
        }
