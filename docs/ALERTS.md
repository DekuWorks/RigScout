# Watchlists, alerts, and notifications

Phase 5 feature surface for RigScout.

## Concepts

| Entity | Purpose |
|--------|---------|
| `watchlists` | Saved products per user (unique per product) |
| `price_alerts` | Target price and/or % drop rules + channels |
| `notifications` | In-app inbox rows (service-role insert, owner read) |

Plan limit: `PLAN_LIMITS.free.maxWatchedProducts` (see `@rigscout/shared`).

## UI

- **Watchlist** — `/app/watchlist`
- **Set price alert** — product detail dialog (also adds to watchlist)
- **Inbox** — header bell; Supabase Realtime on `notifications` when logged in
- **Settings** — `notify_in_app` / `notify_email` prefs

Guest / demo mode stores watchlists, alerts, and a sample notification in `localStorage`.

## Evaluation job

`POST /v1/jobs/evaluate-alerts` with header `X-Job-Token: <ALERT_JOB_TOKEN>`.

Requires:

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- `ALERT_JOB_TOKEN` (disables the route when empty)

Logic:

1. Load active `price_alerts`
2. Resolve best active listing price + recent history high
3. If target or % drop matches → insert `notifications` (`event_key` dedupes), update `last_triggered_*`
4. Email when channel + profile prefs + SMTP are all set

Local smoke:

```bash
export ALERT_JOB_TOKEN=dev-token
# ensure API has the same token in .env
curl -X POST http://127.0.0.1:8000/v1/jobs/evaluate-alerts \
  -H "X-Job-Token: dev-token"
```

GitHub Action: `.github/workflows/evaluate-alerts.yml` (hourly). Set variable `API_BASE_URL` and secret `ALERT_JOB_TOKEN` to enable.

## Email

Optional. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. When unset, in-app notifications still work.
