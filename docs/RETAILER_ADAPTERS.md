# Retailer adapters

All sources implement `RetailerAdapter` in `apps/api/src/adapters/base.py`.

## Contract

Every listing must include: source, external listing ID, product URL, price, shipping (when known), condition, availability, currency, last checked time.

## Current adapters

| Adapter | Status |
|---------|--------|
| `MockRetailerAdapter` | Active — demo data labeled `is_mock=True` |
| Official retailer API | Deferred until credentials / approval |

## Rules

- Respect robots rules, terms, rate limits, and affiliate requirements
- Do not scrape when prohibited or bypass protections
- Clearly label mock/placeholder data
- Prefer official APIs or approved data feeds

## Adding a source

1. Create `apps/api/src/adapters/<name>.py`
2. Implement `fetch_listings` / `fetch_listing`
3. Register in the ingestion job (Phase 3)
4. Document any required secrets in `.env.example` as commented placeholders
