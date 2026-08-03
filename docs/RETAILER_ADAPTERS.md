# Retailer adapters

All sources implement `RetailerAdapter` in `apps/api/src/adapters/base.py`.  
Orchestration lives in `apps/api/src/services/price_sync.py` + `apps/api/src/adapters/registry.py`.

## Contract

Every listing must include: source, external listing ID, product URL, price, shipping (when known), condition, availability, currency, last checked time.

Demo/mock data must set `is_mock=True`. Production catalog has **no** demo products by default.

## Adapter status (honest)

| Adapter | Module | Status | Credentials / feed |
|---------|--------|--------|--------------------|
| Best Buy | `adapters/bestbuy.py` | **Live-ready** when key set | `BEST_BUY_API_KEY` |
| Amazon PA-API 5 | `adapters/amazon_paapi.py` | **Live-ready** when Associates keys set | `AMAZON_PAAPI_*` |
| Newegg | `adapters/newegg.py` | **Feed-gated stub** | `NEWEGG_FEED_PATH` (CSV/JSON). Seller Marketplace keys do **not** enable catalog search |
| Micro Center | `adapters/microcenter.py` | **Feed-gated stub** | `MICROCENTER_FEED_PATH` (CSV/JSON). No public product API |
| Mock | `adapters/mock.py` | Explicit demo only | `--allow-mock` / `allow_mock=true` (never default in production) |

**No HTML scraping.** If a retailer has no approved API/feed, the adapter stays disabled and documents why.

### Research notes (2026-08)

- **Newegg Marketplace API** — seller inventory/orders/feeds only ([developer portal](https://developer.newegg.com/newegg_marketplace_api/)). Not a buyer catalog API.
- **Newegg affiliate product feeds** — may be available after joining via an approved network (Impact / CJ / similar). Not a self-serve public API with keys like Best Buy. Map that export into the RigScout CSV/JSON schema below.
- **Micro Center** — no public product API; community staff have indicated no public affiliate product-feed program. Operator-maintained CSV/JSON only. Third-party scrapers are out of scope / ToS risk.

---

## Best Buy (primary live path)

1. Sign up: [Best Buy Developer Portal](https://developer.bestbuy.com/)
2. Activate the emailed API key
3. Set on Railway (API service): `BEST_BUY_API_KEY=<key>`
4. Redeploy API and trigger sync

Docs: https://bestbuyapis.github.io/api-documentation/

---

## Amazon (PA-API 5 — Associates)

**No scraping.** Official Product Advertising API only.

1. Join [Amazon Associates](https://affiliate-program.amazon.com/)
2. Meet qualification requirements for API access
3. Set `AMAZON_PAAPI_ACCESS_KEY`, `AMAZON_PAAPI_SECRET_KEY`, `AMAZON_PAAPI_PARTNER_TAG` on Railway
4. Redeploy and run sync

PA-API 5 is deprecated in favour of the **Creators API** — this adapter still speaks PA-API 5 SigV4 and surfaces deprecation errors clearly.

---

## Newegg + Micro Center feeds

Neither has a public catalog search API RigScout can call. Both use the shared manual feed importer (`apps/api/src/adapters/manual_feed.py`).

### Env

```bash
# Local path or https URL to CSV/JSON
NEWEGG_FEED_PATH=/var/feeds/newegg.csv
MICROCENTER_FEED_PATH=/var/feeds/microcenter.json
```

Optional unused seller placeholders (do not enable sync):

```bash
# NEWEGG_API_KEY=
# NEWEGG_SELLER_ID=
```

### Feed schema

Required: `external_listing_id`, `product_url`, `title`, and `price` (dollars) **or** `price_minor` (cents).

Optional: `brand`, `category`, `condition`, `availability`, `currency`, `shipping` / `shipping_minor`, `product_slug`, `product_id`, `image_url`.

Examples: [docs/feeds/examples/newegg-sample.csv](./feeds/examples/newegg-sample.csv), [docs/feeds/examples/microcenter-sample.json](./feeds/examples/microcenter-sample.json).

`product_slug` / `product_id` should match an **active** row in `products` for reliable upserts (`import-feed`). Scheduled `sync-prices` can also fuzzy-match by title when a feed is configured.

### How to import today

**A. Env + scheduled sync** (preferred once a feed file/URL exists)

```bash
# Railway / .env
NEWEGG_FEED_PATH=https://example.com/private/newegg.csv
MICROCENTER_FEED_PATH=/data/microcenter.json

# Then:
curl -fsS -X POST \
  -H "X-Job-Token: $ALERT_JOB_TOKEN" \
  "https://api-production-8587.up.railway.app/v1/jobs/sync-prices"
```

**B. One-shot import** (rows must include `product_slug` or `product_id`)

```bash
cd apps/api
uv run python -m src.cli import-feed --source newegg --path ../../docs/feeds/examples/newegg-sample.csv
uv run python -m src.cli import-feed --source microcenter --path ../../docs/feeds/examples/microcenter-sample.json
```

**C. Job endpoint**

```bash
curl -fsS -X POST \
  -H "X-Job-Token: $ALERT_JOB_TOKEN" \
  "https://YOUR_API/v1/jobs/import-retailer-feed?source=newegg"
# uses NEWEGG_FEED_PATH; optional &path= override
```

Until a feed path is set, sync status reports Newegg/Micro Center as **disabled** with a clear reason (not a fake success).

---

## Sync job

Writes (service role only):

- upserts `retailer_listings` on `(source, external_listing_id)`
- appends `price_history`
- records `retailer_sync_runs`

### Triggers

**A. Hosted API**

```bash
curl -fsS -X POST \
  -H "X-Job-Token: $ALERT_JOB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api-production-8587.up.railway.app/v1/jobs/sync-prices"
```

**B. GitHub Action** — `Scheduled Price Sync`  
**C. Local CLI** — `uv run python -m src.cli sync-prices [--dry-run|--allow-mock|--limit N]`

---

## Adding a source

1. Create `apps/api/src/adapters/<name>.py`
2. Implement `fetch_listings` / `fetch_listing`
3. Register credential/feed detection in `adapters/registry.py`
4. Document secrets in `.env.example`
5. Add fixture tests — never claim live success without a real API/feed
