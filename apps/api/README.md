# RigScout API

Python 3.12+ FastAPI service for retailer integrations, deal scoring, compatibility, and alert evaluation.

Ordinary CRUD stays in Supabase. This service handles backend-specific logic and scheduled jobs.

## Setup

```bash
cd apps/api
# Recommended: Astral uv
uv sync

# Or with pip
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"  # if using classic extras; with uv prefer: uv sync --group dev
```

Copy root `.env.example` to repo-root `.env` and fill server secrets.

## Run

```bash
# from repo root
npm run dev:api

# or
cd apps/api && uv run uvicorn src.main:app --reload --port 8000
```

Health: [http://localhost:8000/health](http://localhost:8000/health)

## Price sync (retailer ingestion)

```bash
uv run python -m src.cli sync-prices --dry-run
uv run python -m src.cli sync-prices --allow-mock --limit=5
# Live Best Buy / Amazon when keys are in env:
uv run python -m src.cli sync-prices
```

Token-gated job (same `ALERT_JOB_TOKEN` as alerts): `POST /v1/jobs/sync-prices`  
Retailer docs: [docs/RETAILER_ADAPTERS.md](../../docs/RETAILER_ADAPTERS.md)

## Production host

See [docs/API_HOSTING.md](../../docs/API_HOSTING.md). Quick Docker check:

```bash
docker build -t rigscout-api .
docker run --rm -p 8000:8000 -e ENVIRONMENT=production rigscout-api
```

Railway: set service root to `apps/api` (uses `Dockerfile` + `railway.toml`).

## Test & lint

```bash
uv run ruff check .
uv run pytest
```
