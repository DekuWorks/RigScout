# Row Level Security

RLS policies are implemented with Phase 2 migrations. Design goals:

| Area | Rule |
|------|------|
| profiles | Users read/update only their row |
| builds / build_items | Owner-only write; public share reads limited fields |
| watchlists / price_alerts | Owner-only |
| notifications | Owner-only private read |
| products / listings / history | Public read for authenticated/anon as appropriate |
| price_history writes | Service role / trusted backend only |
| sync runs | Service role only |

Service-role keys never ship in the frontend. Inputs are validated server-side for FastAPI routes.
