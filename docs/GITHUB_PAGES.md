# GitHub Pages deployment

**Production domain:** [https://rigscout.co](https://rigscout.co)

## Enable Pages

1. Repository **Settings → Pages**
2. Source: **GitHub Actions**
3. Custom domain: `rigscout.co` (enforced HTTPS once DNS verifies)
4. Push to `main`/`master` or run **Deploy GitHub Pages** manually

The build publishes `apps/web/public/CNAME` → `dist/CNAME` so Pages keeps the custom domain.

## DNS (at your registrar)

Point the apex (and optional www) at GitHub Pages:

| Type | Host | Value |
|------|------|--------|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |
| `CNAME` | `www` | `<org-or-user>.github.io` |

After DNS propagates, GitHub runs a DNS check and issues a Let’s Encrypt cert (often a few minutes; sometimes longer on a brand-new domain). When the check succeeds, enable **Enforce HTTPS**.

If the UI says **DNS check unsuccessful** but `dig` already shows the correct GitHub `A`/`AAAA` records:

1. Confirm there are no extra `@` records (parking, forwarding, leftover A/CNAME).
2. In Pages settings, remove the custom domain, wait ~1–5 minutes, then re-add `rigscout.co` to restart cert issuance.
3. Wait until HTTPS loads cleanly, then turn on **Enforce HTTPS**.

## Base path

- **Custom domain (`rigscout.co`)**: `VITE_BASE_PATH=/` (workflow default)
- **Project site** (`https://<user>.github.io/RigScout/`): set repo variable `VITE_BASE_PATH=/RigScout/`

Vite `base` and React Router `basename` both read this value.

## SPA fallback

After build, `index.html` is copied to `404.html` so client routes resolve on Pages.

## Supabase Auth URLs

In Supabase **Authentication → URL configuration**, allow:

- Site URL: `https://rigscout.co`
- Redirect URLs: `https://rigscout.co/**`, `https://www.rigscout.co/**`, plus local `http://127.0.0.1:5173/**`

## Not used

Vercel is intentionally not configured.
