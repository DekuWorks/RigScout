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
- `is_mock` flags on retailers/listings for demo data
- Full-text index on product name/brand/model

## Apply locally

```bash
supabase start
supabase db reset   # migrations + seed.sql
supabase status     # copy URL / anon / service_role into .env
```

## Seed accounts (local MOCK)

| Email | Password | Notes |
|-------|----------|-------|
| `demo@rigscout.local` | `password123` | Free tier demo builds/alerts |
| `scout@rigscout.local` | `password123` | Second user for RLS isolation |

Seed catalog includes 10 part categories, 5 mock retailers, current listings, ~90 days of history, compatibility examples, and sample notifications.
