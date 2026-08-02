# RigScout Implementation Status

## Detected starting state (2026-08-02)

| Item | Status |
|------|--------|
| Repository files | **Empty** — only `.git` present |
| Approved brand assets | Provided in Cursor chat — **copied into repo** |
| Prior application code | None |
| Supabase project | Schema now in-repo (Phase 2); remote project still optional |
| Live retailer credentials | **None** (Best Buy / Amazon / Newegg keys absent in env, GitHub, Railway — names checked only) |

**Remote:** https://github.com/DekuWorks/RigScout

---

## Progress checklist

### Phase 1 — Foundation
- [x] Audit repository and document starting state
- [x] Preserve approved logos/icons/palette/UI concepts
- [x] Configure monorepo
- [x] Design system + responsive shell
- [x] Landing / auth shells / dashboard shell
- [x] Env validation + Supabase client stub
- [x] FastAPI health + mock adapter + deal-score module
- [x] Documentation + GitHub Actions
- [x] Clean frontend and backend builds
- [x] Pushed to GitHub `main`

### Phase 2 — Authentication and Database
- [x] Migrations for required tables
- [x] Auth (email/password, Google when configured, forgot/reset)
- [x] Profiles + auto-create trigger
- [x] RLS policies (ownership, public catalog read, service-role writes)
- [x] Protected routes (enforced when Supabase configured)
- [x] Seed data (catalog, 90-day history, two demo users, builds/alerts)
- [x] Isolation notes + smoke SQL + migration contract test
- [x] Live `supabase db reset` against local Docker (grants migration included)

### Phase 3 — Catalog and Price Data
- [x] Discover Parts (search, filters, sort, pagination)
- [x] Product detail (retailer compare, history chart, high/low, alternatives)
- [x] Deals page (trending, largest drops, best scores, marketplace split)
- [x] API demo catalog + deal score wiring (`/v1/products`, `/v1/deals`)
- [x] Live Supabase-backed catalog reads (prefer Supabase when seeded; demo fallback)
- [x] Retailer ingestion path (adapters + sync job + token-gated endpoint + GH Action)
  - [x] Best Buy Remix adapter — **live-ready**; needs `BEST_BUY_API_KEY` (not set yet)
  - [x] Amazon PA-API 5 adapter (SigV4) — **live-ready**; needs Associates keys (not set yet); PA-API 5 deprecated → Creators API note in docs
  - [x] Newegg stub — Marketplace API is seller-only; no catalog search / no scraping
  - [x] Micro Center stub — no public API; no scraping
  - [x] Mock path via `allow_mock` when no live keys
  - [ ] Live production sync with real retailer credentials *(blocked on user keys)*

### Phase 4 — Build Lab
- [x] Build CRUD with Supabase ownership and browser-local demo fallback
- [x] Component selection, preferred listings, purchase prices, totals, and targets
- [x] Compatibility guidance API (socket, RAM, fit, clearance, cooling, PSU headroom)
- [x] JSON/CSV exports and share-slug/link wiring
- [x] Dashboard Build Lab summary and PC hero asset (`pc-hero.png`)
- [x] Public read-only shared build view (`/share/:slug`) + unshare
- [ ] Higgsfield-native PC regen *(optional polish; cutout hero asset live)*

### Phase 5 — Alerts and Realtime
- [x] Watchlists UI + product alert dialog (Supabase + localStorage guest fallback)
- [x] Notification inbox + Realtime subscription
- [x] Alert evaluation job (`POST /v1/jobs/evaluate-alerts`) + optional SMTP
- [x] Hourly GitHub Action workflow (enabled when secrets set)
- [x] Docs: [ALERTS.md](./ALERTS.md)

### Phase 6 — Learn and Polish
- [x] Beginner Learn guides (structured TS + Markdown bodies under `apps/web/src/content/learn/`)
- [x] Learn index + article detail routes (`/app/learn`, `/app/learn/:slug`) with lazy-loaded guide page
- [x] Accessibility polish (skip links, landmarks, focus styles, reduced motion, nav/control labels)
- [x] Loading / empty / error state reuse on Learn + Dashboard gaps
- [x] Lightweight Markdown renderer (no CMS; no heavy markdown dependency)

### Phase 7 — Deployment
- [x] Custom domain `rigscout.co` + Pages CNAME / HTTPS (apex)
- [x] GitHub Actions finalized (Web CI + API CI on every `main` push/PR; Pages; alert cron skip-safe)
- [x] Secrets validation docs + `scripts/validate-env.sh` (local + production-checklist)
- [x] Full test matrix: web lint/typecheck/test/build + API ruff/pytest (local + CI)
- [x] API hosting scaffold (`apps/api/Dockerfile`, `railway.toml`, [API_HOSTING.md](./API_HOSTING.md))
- [x] Live hosted API on Railway (`https://api-production-8587.up.railway.app`) + GitHub `API_BASE_URL` / `ALERT_JOB_TOKEN` / `VITE_API_BASE_URL`
- [x] Finish www dual-host Let’s Encrypt cert (`www` + apex on LE; Pages cert approved for both) — see [GITHUB_PAGES.md](./GITHUB_PAGES.md)
- [x] Alert job schema parity (`retailer_listings.is_active` via migration `20260803000000`; pushed to hosted Supabase; evaluate-alerts returns 200 with no `is_active` errors)
- [x] Settings: profile, theme, currency, region, notification prefs, privacy share default, JSON data export, account deletion (`/v1/account`)


---

## Brand assets in repo

- `apps/web/src/assets/rigscout-brand.png`
- `apps/web/src/assets/rigscout-icon.png`
- `apps/web/public/favicon.png`
- `docs/design-mockup-dashboard.png`

## Palette (approved)

| Token | Hex |
|-------|-----|
| Primary | `#0D6EFD` |
| Accent | `#00C2FF` |
| Navy | `#0F172A` |
| Slate | `#64748B` |
| Off-white | `#F8FAFC` |

## Demo seed accounts (local)

| Email | Password |
|-------|----------|
| `demo@rigscout.local` | `password123` |
| `scout@rigscout.local` | `password123` |
