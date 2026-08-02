# Database / schema guide

Phase 1 includes Supabase config only. **Versioned migrations arrive in Phase 2** for:

- profiles
- products / product_specs
- retailers / retailer_listings
- price_history
- builds / build_items
- watchlists / price_alerts
- notifications
- compatibility_rules
- retailer_sync_runs
- affiliate_clicks

Conventions planned:

- UUID primary keys
- `created_at` / `updated_at` (+ triggers)
- Money as integer minor units + currency codes
- Indexes for search, history, alerts, ownership
- Uniqueness to prevent duplicate listings

See Phase 2 in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).
