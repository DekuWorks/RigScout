# Retailer adapters

All sources implement `RetailerAdapter` in `apps/api/src/adapters/base.py`.  
Orchestration lives in `apps/api/src/services/price_sync.py` + `apps/api/src/adapters/registry.py`.

## Contract

Every listing must include: source, external listing ID, product URL, price, shipping (when known), condition, availability, currency, last checked time.

Demo/mock data must set `is_mock=True`.

## Adapter status (honest)

| Adapter | Module | Status | Credentials |
|---------|--------|--------|-------------|
| Best Buy | `adapters/bestbuy.py` | **Live-ready** when key set | `BEST_BUY_API_KEY` |
| Amazon PA-API 5 | `adapters/amazon_paapi.py` | **Live-ready** when Associates keys set | `AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`, `AMAZON_PAAPI_PARTNER_TAG` |
| Newegg | `adapters/newegg.py` | **Stub** — no public catalog API | Seller Marketplace keys do **not** enable price search |
| Micro Center | `adapters/microcenter.py` | **Stub** — no public product API | N/A (CSV/affiliate later) |
| Mock | `adapters/mock.py` | Demo only (`is_mock=True`) | None — use `--allow-mock` / `allow_mock=true` |

**No HTML scraping.** If a retailer has no approved API/feed, the adapter stays disabled and documents why.

### Credential audit (2026-08-02)

Checked names only (local `.env`, `~/.config/rigscout/production.env`, GitHub secrets, Railway variables):

| Name | Present? |
|------|----------|
| `BEST_BUY_API_KEY` | No |
| `AMAZON_PAAPI_*` | No |
| `NEWEGG_*` | No |

Until keys are added, scheduled sync returns `status=skipped` (or mock if explicitly allowed). Seeded Supabase catalog remains the live demo data.

---

## Best Buy (primary live path)

1. Sign up: [Best Buy Developer Portal](https://developer.bestbuy.com/)
2. Activate the emailed API key
3. Set on Railway (API service): `BEST_BUY_API_KEY=<key>`
4. Redeploy API
5. Trigger sync (see below)

Docs: https://bestbuyapis.github.io/api-documentation/

---

## Amazon (PA-API 5 — Associates)

**No scraping.** Official Product Advertising API only.

### Signup

1. Join [Amazon Associates](https://affiliate-program.amazon.com/)
2. Meet qualification requirements for API access (Associates Central)
3. Create credentials + note your partner tag (e.g. `yoursite-20`)
4. Set on Railway:

```bash
AMAZON_PAAPI_ACCESS_KEY=...
AMAZON_PAAPI_SECRET_KEY=...
AMAZON_PAAPI_PARTNER_TAG=yourtag-20
```

5. Redeploy API and run sync

### Deprecation note

Amazon has deprecated PA-API 5 in favour of the **Creators API** ([migration guide](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi)).  
This adapter implements PA-API 5 SearchItems/GetItems with AWS SigV4. If Amazon returns `AccessDenied` / deprecation, the job surfaces that error clearly — migrate to Creators API credentials (follow-up work) rather than scraping.

---

## Newegg (stub)

Published [Newegg Marketplace API](https://developer.newegg.com/newegg_marketplace_api/) is for **sellers** (inventory, orders, feeds) — not third-party catalog/price discovery.

Optional env placeholders (do not enable sync today):

```bash
# NEWEGG_API_KEY=
# NEWEGG_SELLER_ID=
```

Future: affiliate feed or approved CSV import. Do not scrape Newegg HTML.

---

## Micro Center (stub)

No public product/price API. Adapter refuses fetches with a clear error.

Future: manual CSV, affiliate deep links, or an official partner feed if offered. Do not scrape store pages.

---

## Sync job

Writes (service role only):

- upserts `retailer_listings` on `(source, external_listing_id)`
- appends `price_history`
- records `retailer_sync_runs`

### Triggers

**A. Hosted API (preferred — Railway has the keys)**

```bash
curl -fsS -X POST \
  -H "X-Job-Token: $ALERT_JOB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api-production-8587.up.railway.app/v1/jobs/sync-prices"
```

Optional: `?allow_mock=true` or `?limit=3` for demos / smoke tests.

**B. GitHub Action** — workflow `Scheduled Price Sync` (`.github/workflows/price-sync.yml`)  
Calls the same endpoint when `API_BASE_URL` + `ALERT_JOB_TOKEN` are set (every 6 hours + manual dispatch).

**C. Local CLI**

```bash
cd apps/api
uv run python -m src.cli sync-prices --dry-run
uv run python -m src.cli sync-prices --allow-mock --limit=5
uv run python -m src.cli sync-prices   # live adapters only
```

---

## Secret wiring checklist

| Where | Variables |
|-------|-----------|
| Railway (API) | `BEST_BUY_API_KEY`, `AMAZON_PAAPI_*`, existing `SUPABASE_*`, `ALERT_JOB_TOKEN` |
| GitHub Actions | Secret `ALERT_JOB_TOKEN`; variable `API_BASE_URL` (already used by alerts) |
| Optional GitHub secrets | Mirror retailer keys only if you run the CLI inside Actions instead of the API |

```bash
# After you have values (never commit them):
railway variables --set "BEST_BUY_API_KEY=..."
railway variables --set "AMAZON_PAAPI_ACCESS_KEY=..."
railway variables --set "AMAZON_PAAPI_SECRET_KEY=..."
railway variables --set "AMAZON_PAAPI_PARTNER_TAG=..."
# or: gh secret set BEST_BUY_API_KEY
```

---

## Adding a source

1. Create `apps/api/src/adapters/<name>.py`
2. Implement `fetch_listings` / `fetch_listing`
3. Register credential detection in `adapters/registry.py`
4. Document secrets in `.env.example` as commented placeholders
5. Add fixture tests — never claim live success without a real API call
