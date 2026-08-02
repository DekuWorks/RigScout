# Deal score

Score range: **0–100**. Returns **no score** when history is thinner than the configured minimum (default 7 points).

## Default weights

| Factor | Weight | Notes |
|--------|--------|-------|
| vs 30-day average | 0.30 | Primary signal |
| vs 90-day average | 0.20 | Trend context |
| Distance from historical low | 0.25 | Near-low rewards |
| Availability | 0.10 | In-stock preferred |
| Condition | 0.08 | new > refurbished > used |
| Shipping | 0.04 | Free shipping preferred |
| Retailer confidence | 0.03 | Source trust |

Implementation: `apps/api/src/core/deal_score.py`  
UI labels: `dealScoreLabel()` in `@rigscout/shared`

Weights are intentionally configurable for tuning without UI changes.
