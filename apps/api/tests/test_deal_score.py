from src.core.deal_score import compute_deal_score


def test_insufficient_history_returns_none() -> None:
    score = compute_deal_score(
        current_price_minor=50000,
        avg_30d_minor=55000,
        avg_90d_minor=None,
        historical_low_minor=48000,
        history_points=2,
    )
    assert score is None


def test_good_deal_scores_high() -> None:
    score = compute_deal_score(
        current_price_minor=40000,
        avg_30d_minor=55000,
        avg_90d_minor=60000,
        historical_low_minor=39000,
        history_points=30,
        available=True,
        condition="new",
        shipping_minor=0,
        retailer_confidence=0.9,
    )
    assert score is not None
    assert score >= 70


def test_expensive_listing_scores_lower() -> None:
    score = compute_deal_score(
        current_price_minor=70000,
        avg_30d_minor=55000,
        avg_90d_minor=52000,
        historical_low_minor=48000,
        history_points=30,
        available=True,
        condition="used",
        shipping_minor=2000,
        retailer_confidence=0.5,
    )
    assert score is not None
    assert score < 55
