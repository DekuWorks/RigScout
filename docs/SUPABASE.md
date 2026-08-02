# Supabase local development

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local stack)

## Commands

```bash
# from repo root
supabase start
supabase status   # copy URL + anon + service_role into .env
supabase db reset # applies migrations + seed.sql (Phase 2+)
```

Phase 2 includes `supabase/migrations/20260802180000_phase2_schema.sql` and rich `seed.sql`.

```bash
supabase start
supabase db reset
# then copy API URL + anon key + service_role into root .env
```

Redirect URLs to allow locally: `http://localhost:5173/**` (Auth → URL configuration).

## How Supabase and Python work together

1. Users authenticate via Supabase Auth in the browser (anon key).
2. The web app reads/writes user-owned rows under RLS.
3. Scheduled Python jobs use the **service role** to upsert listings and price history (bypassing RLS carefully).
4. Alert evaluation inserts notifications; Realtime pushes updates to open clients.
5. FastAPI exposes scoring/compatibility endpoints that do not need to own CRUD tables.

Learning tip: treat Supabase as the system of record; treat Python as the worker that refreshes market data and evaluates rules.
