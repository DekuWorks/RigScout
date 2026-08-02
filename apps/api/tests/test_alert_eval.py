from src.services.alert_eval import AlertRule, should_trigger, wants_email, wants_in_app


def _rule(**overrides: object) -> AlertRule:
    base = dict(
        id="alert-1",
        user_id="user-1",
        product_id="prod-1",
        product_name="RTX 4070 Super",
        target_price_minor=58000,
        percent_drop=10.0,
        channel_in_app=True,
        channel_email=True,
        notify_in_app=True,
        notify_email=True,
        user_email="demo@rigscout.local",
    )
    base.update(overrides)
    return AlertRule(**base)  # type: ignore[arg-type]


def test_target_price_triggers() -> None:
    result = should_trigger(
        alert=_rule(percent_drop=None),
        current_price_minor=57999,
        recent_high_minor=65000,
        day_key="2026-08-02",
    )
    assert result.triggered is True
    assert "target" in result.reason
    assert result.event_key.endswith("57999")


def test_percent_drop_triggers() -> None:
    result = should_trigger(
        alert=_rule(target_price_minor=None, percent_drop=10),
        current_price_minor=54000,
        recent_high_minor=60000,
        day_key="2026-08-02",
    )
    assert result.triggered is True
    assert "drop" in result.reason


def test_no_match() -> None:
    result = should_trigger(
        alert=_rule(),
        current_price_minor=62000,
        recent_high_minor=63000,
        day_key="2026-08-02",
    )
    assert result.triggered is False


def test_channel_prefs() -> None:
    alert = _rule(channel_in_app=True, notify_in_app=False, channel_email=True, notify_email=True)
    assert wants_in_app(alert) is False
    assert wants_email(alert) is True
    assert wants_email(_rule(user_email=None)) is False
