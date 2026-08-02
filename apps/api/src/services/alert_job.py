"""Load active alerts from Supabase and evaluate against live listings."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx

from src.core.config import Settings
from src.services.alert_eval import AlertRule, should_trigger, wants_email, wants_in_app
from src.services.email import send_alert_email
from src.services.supabase_rest import SupabaseRest, SupabaseRestError


def _user_email(settings: Settings, user_id: str) -> str | None:
    """Best-effort lookup via GoTrue admin API."""
    url = settings.supabase_url.rstrip("/") + f"/auth/v1/admin/users/{user_id}"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, headers=headers)
        if response.status_code >= 400:
            return None
        data = response.json()
        email = data.get("email")
        return email if isinstance(email, str) and email else None
    except Exception:
        return None


def _best_listing_price(listings: list[dict[str, Any]]) -> int | None:
    prices: list[int] = []
    for listing in listings:
        if listing.get("availability") not in (None, "in_stock", "preorder", "unknown"):
            # still consider price if present
            pass
        price = listing.get("price_minor")
        shipping = listing.get("shipping_minor") or 0
        if isinstance(price, int):
            prices.append(price + (shipping if isinstance(shipping, int) else 0))
    return min(prices) if prices else None


def _recent_high(history: list[dict[str, Any]]) -> int | None:
    prices = [row["price_minor"] for row in history if isinstance(row.get("price_minor"), int)]
    return max(prices) if prices else None


def evaluate_alerts(settings: Settings) -> dict[str, Any]:
    db = SupabaseRest(settings)
    alerts = db.get(
        "price_alerts",
        {
            "select": "*",
            "is_active": "eq.true",
        },
    )

    checked = 0
    triggered = 0
    notified = 0
    emailed = 0
    skipped = 0
    errors: list[str] = []

    for row in alerts:
        checked += 1
        try:
            product_id = str(row["product_id"])
            user_id = str(row["user_id"])
            products = db.get("products", {"select": "id,name", "id": f"eq.{product_id}"})
            product = products[0] if products else {"name": "Product"}
            profile_rows = db.get(
                "profiles",
                {
                    "select": "notify_in_app,notify_email",
                    "id": f"eq.{user_id}",
                },
            )
            profile = profile_rows[0] if profile_rows else {}
            user_email = _user_email(settings, user_id)

            listings = db.get(
                "retailer_listings",
                {
                    "select": "price_minor,shipping_minor,availability",
                    "product_id": f"eq.{product_id}",
                    "is_active": "eq.true",
                },
            )
            current = _best_listing_price(listings)
            if current is None:
                skipped += 1
                continue

            history = db.get(
                "price_history",
                {
                    "select": "price_minor",
                    "product_id": f"eq.{product_id}",
                    "order": "recorded_at.desc",
                    "limit": "90",
                },
            )
            high = _recent_high(history)

            rule = AlertRule(
                id=str(row["id"]),
                user_id=user_id,
                product_id=product_id,
                product_name=str(product.get("name") or "Product"),
                target_price_minor=row.get("target_price_minor"),
                percent_drop=(
                    float(row["percent_drop"]) if row.get("percent_drop") is not None else None
                ),
                channel_in_app=bool(row.get("channel_in_app", True)),
                channel_email=bool(row.get("channel_email", False)),
                notify_in_app=bool(profile.get("notify_in_app", True)),
                notify_email=bool(profile.get("notify_email", True)),
                user_email=user_email,
            )
            result = should_trigger(
                alert=rule,
                current_price_minor=current,
                recent_high_minor=high,
            )
            if not result.triggered:
                skipped += 1
                continue

            triggered += 1
            now = datetime.now(UTC).isoformat()

            if wants_in_app(rule):
                try:
                    db.post(
                        "notifications",
                        {
                            "user_id": user_id,
                            "alert_id": rule.id,
                            "product_id": product_id,
                            "title": result.title,
                            "body": result.body,
                            "event_key": result.event_key,
                        },
                    )
                    notified += 1
                except SupabaseRestError as exc:
                    # Unique violation on event_key = already notified today
                    if "duplicate" in str(exc).lower() or exc.status_code == 409:
                        skipped += 1
                    else:
                        errors.append(f"notify {rule.id}: {exc}")

            if wants_email(rule) and rule.user_email:
                if send_alert_email(
                    settings,
                    to_email=rule.user_email,
                    subject=result.title,
                    body=result.body + "\n\n— RigScout",
                ):
                    emailed += 1

            db.patch(
                "price_alerts",
                {
                    "last_triggered_at": now,
                    "last_triggered_price_minor": current,
                },
                {"id": f"eq.{rule.id}"},
            )
        except Exception as exc:  # noqa: BLE001 — job should continue
            errors.append(str(exc))

    return {
        "checked": checked,
        "triggered": triggered,
        "notifications_written": notified,
        "emails_sent": emailed,
        "skipped": skipped,
        "errors": errors[:20],
    }
