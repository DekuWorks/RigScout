"""CLI entrypoints for scheduled jobs.

Examples:
  uv run python -m src.cli sync-prices
  uv run python -m src.cli sync-prices --allow-mock
  uv run python -m src.cli sync-prices --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

from src.adapters.registry import credential_checklist, plan_adapters
from src.core.config import get_settings
from src.services.price_sync import run_price_sync


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="rigscout-api", description="RigScout API jobs")
    sub = parser.add_subparsers(dest="command", required=True)

    sync = sub.add_parser("sync-prices", help="Ingest retailer listings + price history")
    sync.add_argument(
        "--allow-mock",
        action="store_true",
        help="Use MockRetailerAdapter when no live retailer credentials are set",
    )
    sync.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of catalog products to match (useful for dry runs)",
    )
    sync.add_argument(
        "--dry-run",
        action="store_true",
        help="Report credential/config status without writing (no Supabase upserts)",
    )
    return parser


async def _sync_prices(args: argparse.Namespace) -> int:
    settings = get_settings()
    plans = plan_adapters(settings, allow_mock=args.allow_mock)
    enabled = [p.source for p in plans if p.enabled]
    disabled = [
        {"source": p.source, "reason": p.reason, "credentials_missing": list(p.credentials_missing)}
        for p in plans
        if not p.enabled
    ]

    if args.dry_run:
        report = {
            "status": "dry_run",
            "supabase_configured": settings.supabase_configured,
            "best_buy_configured": settings.best_buy_configured,
            "amazon_paapi_configured": settings.amazon_paapi_configured,
            "enabled_sources": enabled,
            "disabled_sources": disabled,
            "credentials_required_next": credential_checklist(),
            "message": (
                f"Ready to sync: {', '.join(enabled)}."
                if enabled
                else (
                    "No live retailer credentials. Set BEST_BUY_API_KEY and/or Amazon PA-API "
                    "keys (see credentials_required_next), then redeploy. "
                    "Mock path: add --allow-mock."
                )
            ),
            "allow_mock": args.allow_mock,
            "product_limit": args.limit,
        }
        print(json.dumps(report, indent=2))
        return 0 if settings.supabase_configured else 2

    result = await run_price_sync(
        settings,
        allow_mock=args.allow_mock,
        product_limit=args.limit,
    )
    print(json.dumps(result, indent=2))
    status = result.get("status")
    if status in {"succeeded", "partial", "skipped"}:
        return 0
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command == "sync-prices":
        return asyncio.run(_sync_prices(args))
    parser.error(f"Unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
