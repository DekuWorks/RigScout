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
