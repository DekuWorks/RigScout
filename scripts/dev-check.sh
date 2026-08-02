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

echo "==> Phase 1 checks passed"
