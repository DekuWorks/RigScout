# Environment variables

Copy `.env.example` to `.env` at the repository root.

## Frontend (`VITE_*`)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | For auth/data | Public project URL |
| `VITE_SUPABASE_ANON_KEY` | For auth/data | Anon key only — RLS enforced |
| `VITE_API_BASE_URL` | Yes for API calls | Default `http://localhost:8000` |
| `VITE_BASE_PATH` | For Pages | `/` local/custom domain; `/RepoName/` for project pages |

Validated at startup in `apps/web/src/lib/env.ts` (Zod).

## Backend

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | For jobs | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For jobs | **Server only** |
| `SUPABASE_JWT_SECRET` | Optional | Token validation |
| `API_CORS_ORIGINS` | Yes in prod | Comma-separated origins |
| `API_RATE_LIMIT_PER_MINUTE` | Optional | Default 60 |
| `SMTP_*` | Optional | Email alerts (Phase 5) |

## GitHub Secrets / Variables

**Secrets:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Variables:** `VITE_BASE_PATH`, `VITE_API_BASE_URL`

Never commit real `.env` files or paste secrets into docs/issues.
