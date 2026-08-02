#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Web lint / typecheck / test / build"
npm run lint:web
npm run typecheck:web
npm run test:web
npm run build:web

echo "==> API lint / test"
cd apps/api
uv sync --group dev
uv run ruff check .
uv run pytest

echo "==> Env validation (presence only; values never printed)"
cd "$ROOT"
chmod +x scripts/validate-env.sh
# Local mode warns on missing optional vars; do not fail the full matrix on demo setups
./scripts/validate-env.sh local || true

echo "==> Full local matrix passed"
