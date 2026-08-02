# RigScout

**Track. Compare. Build Smarter.**  
**Site:** [https://rigscout.co](https://rigscout.co)

RigScout helps PC builders find components, compare retailer prices, track complete builds, monitor price history, and receive deal alerts — approachable for beginners, useful for enthusiasts.

> Dark-first hardware dashboard × market analytics × beginner build assistant.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, Recharts, Lucide, Framer Motion
- **Backend data:** Supabase (Auth, Postgres, RLS, Realtime, Storage)
- **Workers/API:** Python 3.12+, FastAPI, Pydantic, HTTPX, Ruff, pytest
- **Deploy:** GitHub Pages + GitHub Actions (no Vercel)

## Monorepo layout

```
rigscout/
  apps/web/          # Vite React app
  apps/api/          # FastAPI service
  packages/shared/   # Shared TS constants
  supabase/          # Migrations, seed, config
  packages/          # Shared libraries
  scripts/           # Dev helpers
  docs/              # Architecture & guides
  .github/workflows/ # CI, Pages, scheduled sync
```

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (recommended for the API)
- Optional: Supabase CLI + Docker for local DB

### 1. Clone and install

```bash
git clone <your-fork-url> RigScout
cd RigScout
cp .env.example .env
npm install
cd apps/api && uv sync --group dev && cd ../..
```

### 2. Run locally

```bash
# Terminal A — frontend (http://localhost:5173)
npm run dev:web

# Terminal B — API (http://localhost:8000)
npm run dev:api
```

Without Supabase credentials the UI runs in **demo mode** (auth disabled, mock metrics). Set `VITE_SUPABASE_*` and `SUPABASE_*` when ready (Phase 2).

### 3. Verify

```bash
chmod +x scripts/dev-check.sh
./scripts/dev-check.sh
```

Or individually:

```bash
npm run lint:web && npm run typecheck:web && npm run test:web && npm run build:web
cd apps/api && uv run ruff check . && uv run pytest
```

## Documentation

| Doc | Topic |
|-----|--------|
| [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | Phase checklist & starting audit |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Env vars & secrets |
| [docs/SUPABASE.md](docs/SUPABASE.md) | Local Supabase + Python interplay |
| [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md) | Pages deployment |
| [docs/DEAL_SCORE.md](docs/DEAL_SCORE.md) | Deal score formula |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |
| [apps/api/README.md](apps/api/README.md) | Python backend |

## Design

Approved RigScout identity is preserved:

- Palette: `#0D6EFD` · `#00C2FF` · `#0F172A` · `#64748B` · `#F8FAFC`
- Assets under `apps/web/src/assets/` and `docs/design-mockup-dashboard.png`

## Security notes

- Never commit `.env` or service-role keys
- Frontend uses **anon** key only
- Service role is for Python jobs / trusted server paths only
- RLS lands with Phase 2 migrations

## License

Private / unlicensed unless otherwise stated by the owner.
