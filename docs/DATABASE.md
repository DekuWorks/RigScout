# Database / schema guide

Phase 2 ships the first versioned migration:

`supabase/migrations/20260802180000_phase2_schema.sql`

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User preferences (1:1 with `auth.users`) |
| `products` | Canonical part catalog |
| `product_specs` | Key/value specs for compatibility + filters |
| `retailers` | Retailer / marketplace sources |
| `retailer_listings` | Current offers (unique per source + external ID) |
| `price_history` | Append-only price samples |
| `builds` / `build_items` | User builds and selected components |
| `watchlists` | Saved products |
| `price_alerts` | Target price / % drop rules |
| `notifications` | In-app notification inbox (`event_key` dedupe) |
| `compatibility_rules` | Declarative guidance rules |
| `retailer_sync_runs` | Ingestion job audit trail |
| `affiliate_clicks` | Attribution events |

## Conventions

- UUID primary keys (`gen_random_uuid()`)
- `created_at` / `updated_at` with `set_updated_at` trigger
- Money as integer **minor units** + ISO `currency`
- `source_checked_at` / `recorded_at` for provenance
- `is_mock` flags reserved for explicitly labeled non-production data (default seed has none)
- Full-text index on product name/brand/model

## Apply locally

```bash
supabase start
supabase db reset   # migrations + seed.sql (retailers + compatibility rules only)
supabase status     # copy URL / anon / service_role into .env
```

### Default seed (`seed.sql`) — production-safe

- Real retailers: `amazon`, `newegg`, `bestbuy`, `microcenter` (`is_mock=false`)
- Compatibility rules
- **No** products, listings, price history, demo users, builds, or alerts

### Optional local demo seed (`seed_demo.sql`)

For UI demos only — **do not apply to hosted Supabase**:

```bash
# After db reset (optional):
psql "$(supabase status -o env | sed -n 's/^DB_URL=//p')" -f supabase/seed_demo.sql
```

Or temporarily add `"./seed_demo.sql"` to `[db.seed].sql_paths` in `supabase/config.toml`.

| Email | Password | Notes |
|-------|----------|-------|
| `demo@rigscout.local` | `password123` | Local demo only |
| `scout@rigscout.local` | `password123` | Second user for RLS isolation |

Production: create a real account (email or Google SSO). There is no demo catalog in hosted environments.
