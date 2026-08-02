# RigScout Architecture

## Overview

RigScout is a monorepo:

| Path | Role |
|------|------|
| `apps/web` | React + Vite frontend (GitHub Pages) |
| `apps/api` | FastAPI — ingestion, scoring, compatibility, alerts |
| `packages/shared` | Shared TypeScript constants/types |
| `supabase/` | Migrations, seed, local config |
| `.github/workflows` | CI, Pages deploy, scheduled sync |

## Data ownership

- **Supabase**: Auth, profiles, CRUD for builds/watchlists/alerts, product catalog storage, Realtime, Storage, RLS.
- **Python/FastAPI**: Retailer adapters, normalization, scheduled price collection, deal scoring, compatibility evaluation, alert evaluation, notification generation.

Do **not** duplicate ordinary CRUD in FastAPI when Supabase + RLS can handle it safely.

## Trust boundaries

```
Browser  --anon key-->  Supabase (RLS)
Browser  ----------->  FastAPI (public/read endpoints; rate-limited)
Python jobs --service role--> Supabase (price history, sync writes)
```

Service-role keys never enter the frontend bundle.

## Frontend stack

React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand (theme/shared client state only), Recharts, Lucide, Framer Motion.

## Deployment

- Frontend → GitHub Pages (`pages.yml`)
- API → separate host of your choice (not Vercel; configure CORS + secrets)
- Scheduled jobs → GitHub Actions (`price-sync.yml`)

## Phased delivery

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).
