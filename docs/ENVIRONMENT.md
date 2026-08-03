# Environment variables

Copy `.env.example` to `.env` at the repository root for local development.  
Never commit real `.env` files or paste secrets into docs/issues.

Validate without printing values:

```bash
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh local                 # checks repo-root .env
./scripts/validate-env.sh production-checklist  # checks GitHub secret/variable names via gh
```

---

## Local development

### Frontend (`VITE_*`)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | For auth/data | Public project URL |
| `VITE_SUPABASE_ANON_KEY` | For auth/data | Anon key only — RLS enforced |
| `VITE_API_BASE_URL` | Yes for API calls | Default `http://localhost:8000` |
| `VITE_SITE_URL` | Optional | Default `https://rigscout.co` |
| `VITE_BASE_PATH` | For Pages | `/` for local + `rigscout.co`; `/RepoName/` for project pages |

Validated at startup in `apps/web/src/lib/env.ts` (Zod). Google OAuth is configured in Supabase / Google Cloud — not as `VITE_*` (see [AUTH_GOOGLE.md](./AUTH_GOOGLE.md)).

### Backend (FastAPI)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | For jobs | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For jobs | **Server only** |
| `SUPABASE_JWT_SECRET` | Optional | Token validation |
| `API_CORS_ORIGINS` | Recommended | Comma-separated origins (include Vite + site) |
| `API_RATE_LIMIT_PER_MINUTE` | Optional | Default 60 |
| `SMTP_*` | Optional | Email alerts |
| `ALERT_JOB_TOKEN` | For jobs | Protects `POST /v1/jobs/*` (alerts + price sync) |
| `BEST_BUY_API_KEY` | For live Best Buy sync | [Developer portal](https://developer.bestbuy.com/) |
| `AMAZON_PAAPI_ACCESS_KEY` | For live Amazon sync | Associates + PA-API / Creators access |
| `AMAZON_PAAPI_SECRET_KEY` | For live Amazon sync | With access key + partner tag |
| `AMAZON_PAAPI_PARTNER_TAG` | For live Amazon sync | e.g. `yoursite-20` |
| `NEWEGG_API_KEY` / `NEWEGG_SELLER_ID` | Unused for catalog | Seller Marketplace only — does not enable sync |
| `NEWEGG_FEED_PATH` | For Newegg feed sync | Local path or https URL to CSV/JSON |
| `MICROCENTER_FEED_PATH` | For Micro Center feed sync | Local path or https URL to CSV/JSON |

---

## Production (GitHub Pages + hosted API)

### GitHub Actions secrets

| Secret | Used by | Status expectation |
|--------|---------|-------------------|
| `VITE_SUPABASE_URL` | Pages deploy | Required |
| `VITE_SUPABASE_ANON_KEY` | Pages deploy | Required |
| `SUPABASE_URL` | Price-sync / future jobs | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Price-sync / future jobs | Required |
| `ALERT_JOB_TOKEN` | Evaluate-alerts workflow | Set when API is hosted |

### GitHub Actions variables

| Variable | Used by | Notes |
|----------|---------|-------|
| `VITE_BASE_PATH` | Pages | Default `/` for `rigscout.co` |
| `VITE_SITE_URL` | Pages | Default `https://rigscout.co` |
| `VITE_API_BASE_URL` | Pages build | Set to hosted API URL when live |
| `API_BASE_URL` | Evaluate-alerts cron | Hosted API origin (no trailing slash) |

### Hosted API (Railway etc.)

See [API_HOSTING.md](./API_HOSTING.md). Minimum: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALERT_JOB_TOKEN`, `API_CORS_ORIGINS=https://rigscout.co,https://www.rigscout.co`, `ENVIRONMENT=production`.

For live retailer ingestion (optional until keys exist): `BEST_BUY_API_KEY` and/or `AMAZON_PAAPI_*` — see [RETAILER_ADAPTERS.md](./RETAILER_ADAPTERS.md).

---

## Secrets validation checklist

- [ ] Local `.env` present (not committed); `./scripts/validate-env.sh local`
- [ ] Pages secrets set: `VITE_SUPABASE_*`
- [ ] Service-role secrets set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Hosted API deployed ([API_HOSTING.md](./API_HOSTING.md))
- [ ] `ALERT_JOB_TOKEN` matches on host + GitHub secret
- [ ] GitHub variable `API_BASE_URL` = hosted origin
- [ ] GitHub variable `VITE_API_BASE_URL` = hosted origin; Pages redeployed
- [ ] Manual run of **Evaluate price alerts** workflow succeeds
- [ ] `./scripts/validate-env.sh production-checklist` (warnings OK until API is hosted)

List secret **names** only:

```bash
gh secret list -R DekuWorks/RigScout
gh variable list -R DekuWorks/RigScout
```
