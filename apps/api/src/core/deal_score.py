"""Transparent 0–100 deal score (weights configurable).

Factors (when data exists):
- Current vs 30-day average
- Current vs 90-day average
- Distance from historical low
- Availability
- Listing condition
- Shipping cost
- Retailer confidence

Returns None when history is too limited for a reliable score.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DealScoreWeights:
    vs_30d: float = 0.30
    vs_90d: float = 0.20
    vs_low: float = 0.25
    availability: float = 0.10
    condition: float = 0.08
    shipping: float = 0.04
    retailer: float = 0.03


DEFAULT_WEIGHTS = DealScoreWeights()


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _ratio_score(current: float, baseline: float) -> float:
    """Higher when current is below baseline. 100 at 30%+ under baseline."""
    if baseline <= 0:
        return 50.0
    discount = (baseline - current) / baseline
    return _clamp(50 + discount * (50 / 0.30))


def compute_deal_score(
    *,
    current_price_minor: int,
    avg_30d_minor: int | None,
    avg_90d_minor: int | None,
    historical_low_minor: int | None,
    history_points: int,
    available: bool = True,
    condition: str = "new",
    shipping_minor: int | None = 0,
    retailer_confidence: float = 0.8,
    weights: DealScoreWeights = DEFAULT_WEIGHTS,
    min_history_points: int = 7,
) -> float | None:
    """Return 0–100 score, or None if history is insufficient."""
    if history_points < min_history_points or avg_30d_minor is None:
        return None

    current = float(current_price_minor)
    parts: list[tuple[float, float]] = []

    parts.append((weights.vs_30d, _ratio_score(current, float(avg_30d_minor))))

    if avg_90d_minor is not None:
        parts.append((weights.vs_90d, _ratio_score(current, float(avg_90d_minor))))

    if historical_low_minor is not None and historical_low_minor > 0:
        # 100 near the low; decays as price rises above it
        distance = (current - float(historical_low_minor)) / float(historical_low_minor)
        low_score = _clamp(100 - distance * 120)
        parts.append((weights.vs_low, low_score))

    parts.append((weights.availability, 100.0 if available else 20.0))

    condition_map = {"new": 100.0, "refurbished": 75.0, "used": 55.0}
    parts.append((weights.condition, condition_map.get(condition, 60.0)))

    if shipping_minor is None:
        ship_score = 60.0
    elif shipping_minor == 0:
        ship_score = 100.0
    else:
        # Penalize shipping relative to item price
        ship_ratio = float(shipping_minor) / max(current, 1.0)
        ship_score = _clamp(100 - ship_ratio * 200)
    parts.append((weights.shipping, ship_score))

    parts.append((weights.retailer, _clamp(retailer_confidence * 100)))

    weight_sum = sum(w for w, _ in parts) or 1.0
    score = sum(w * s for w, s in parts) / weight_sum
    return round(_clamp(score), 1)
