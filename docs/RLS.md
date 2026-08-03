# Row Level Security

RLS is enabled on every public table in the Phase 2 migration.

## Policy summary

| Area | Access |
|------|--------|
| `profiles` | Select/update own row only |
| Catalog (`products`, specs, retailers, listings, `price_history`, compatibility rules) | Public **read**; no insert/update/delete for anon/authenticated |
| `builds` / `build_items` | Owner CRUD; **public builds** readable by anyone |
| `watchlists` / `price_alerts` | Owner CRUD |
| `notifications` | Owner select/update/delete; **inserts are service-role only** |
| `affiliate_clicks` | Insert own (or anonymous with null user); select own |
| `retailer_sync_runs` | No client policies → **service role only** |
| `price_history` writes | Service role only (no client write policies) |

## Auth helpers

- `handle_new_user` trigger creates a `profiles` row on signup (`security definer`)
- Frontend uses the **anon key** only; RLS still applies
- Python jobs use **service role** for ingestion/history/notification inserts

## Isolation testing

1. Reset DB: `supabase db reset` (production-safe seed — empty catalog)
2. Optionally load local demo users/builds: `psql … -f supabase/seed_demo.sql`
3. Sign in as `demo@rigscout.local` and confirm you **cannot** see scout’s private build (`Isolation Test Build`)
4. Open public share slug `demo-streaming-setup` while signed out / as another user — should be readable
5. Confirm catalog products remain readable without auth when present (empty catalog is also valid)
6. Optional SQL notes: `supabase/tests/rls_smoke.sql`

## Shared builds

`builds.is_public = true` (and optional `share_slug`) exposes the build row and its items for read. The app must still select only fields intended for public share pages (Phase 4).
