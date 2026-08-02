"""Pure alert evaluation helpers (unit-testable without Supabase)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class AlertRule:
    id: str
    user_id: str
    product_id: str
    product_name: str
    target_price_minor: int | None
    percent_drop: float | None
    channel_in_app: bool
    channel_email: bool
    notify_in_app: bool
    notify_email: bool
    user_email: str | None


@dataclass(frozen=True)
class TriggerResult:
    triggered: bool
    reason: str
    current_price_minor: int
    event_key: str
    title: str
    body: str


def should_trigger(
    *,
    alert: AlertRule,
    current_price_minor: int,
    recent_high_minor: int | None,
    day_key: str | None = None,
) -> TriggerResult:
    """Return whether an alert should fire for the given market snapshot."""
    day = day_key or datetime.now(UTC).strftime("%Y-%m-%d")
    reasons: list[str] = []

    if alert.target_price_minor is not None and current_price_minor <= alert.target_price_minor:
        reasons.append(
            f"price {current_price_minor} <= target {alert.target_price_minor}",
        )

    if (
        alert.percent_drop is not None
        and recent_high_minor is not None
        and recent_high_minor > 0
    ):
        drop_pct = ((recent_high_minor - current_price_minor) / recent_high_minor) * 100
        if drop_pct >= float(alert.percent_drop):
            reasons.append(
                f"{drop_pct:.1f}% drop from high {recent_high_minor} "
                f"(threshold {alert.percent_drop}%)",
            )

    event_key = f"alert-{alert.id}-{day}-{current_price_minor}"
    if not reasons:
        return TriggerResult(
            triggered=False,
            reason="no match",
            current_price_minor=current_price_minor,
            event_key=event_key,
            title="",
            body="",
        )

    dollars = current_price_minor / 100
    title = f"Price alert: {alert.product_name}"
    body = (
        f"{alert.product_name} is ${dollars:,.2f}. "
        f"Matched: {'; '.join(reasons)}."
    )
    return TriggerResult(
        triggered=True,
        reason="; ".join(reasons),
        current_price_minor=current_price_minor,
        event_key=event_key,
        title=title,
        body=body,
    )


def wants_in_app(alert: AlertRule) -> bool:
    return alert.channel_in_app and alert.notify_in_app


def wants_email(alert: AlertRule) -> bool:
    return bool(alert.channel_email and alert.notify_email and alert.user_email)
