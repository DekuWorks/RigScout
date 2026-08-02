# GitHub Pages deployment

## Enable Pages

1. Repository **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main`/`master` or run **Deploy GitHub Pages** manually

## Base path

- **Project site** (`https://<user>.github.io/RigScout/`): set `VITE_BASE_PATH=/RigScout/` (workflow default uses repo name)
- **Custom domain**: set repository variable `VITE_BASE_PATH=/`

Vite `base` and React Router `basename` both read this value.

## SPA fallback

After build, `index.html` is copied to `404.html` so client routes resolve on Pages.

## Not used

Vercel is intentionally not configured.
