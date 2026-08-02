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

## Test & lint

```bash
uv run ruff check .
uv run pytest
```
