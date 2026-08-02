"""Lightweight contract check: Phase 2 migration defines required tables."""

from pathlib import Path

REQUIRED_TABLES = [
    "profiles",
    "products",
    "product_specs",
    "retailers",
    "retailer_listings",
    "price_history",
    "builds",
    "build_items",
    "watchlists",
    "price_alerts",
    "notifications",
    "compatibility_rules",
    "retailer_sync_runs",
    "affiliate_clicks",
]


def test_phase2_migration_defines_required_tables() -> None:
    root = Path(__file__).resolve().parents[3]
    migration = root / "supabase" / "migrations" / "20260802180000_phase2_schema.sql"
    sql = migration.read_text(encoding="utf-8")
    for table in REQUIRED_TABLES:
        assert f"create table public.{table}" in sql, f"missing table {table}"
    assert "enable row level security" in sql
    assert "handle_new_user" in sql
