# Hosted API (alert job + FastAPI)

GitHub Pages serves the React app. The FastAPI service must run elsewhere so the hourly alert job can call `POST /v1/jobs/evaluate-alerts`.

**Recommended host:** [Railway](https://railway.app) (simple Dockerfile deploy, free trial / usage-based billing). Alternatives: Fly.io, Render — same Docker image works.

Scaffold in-repo:

| File | Purpose |
|------|---------|
| [`apps/api/Dockerfile`](../apps/api/Dockerfile) | Production image (`uv` + uvicorn, respects `$PORT`) |
| [`apps/api/railway.toml`](../apps/api/railway.toml) | Health check + Docker build hints |

No live retailer integrations are required for hosting; demo catalog + Supabase-backed alert evaluation are enough.

## Deploy on Railway (recommended)

1. Create a Railway account and **New Project → Deploy from GitHub** → select `DekuWorks/RigScout`.
2. Set the service **Root Directory** to `apps/api` (so Railway finds `Dockerfile` + `railway.toml`).
3. Generate a public domain (**Settings → Networking → Generate Domain**), e.g. `https://rigscout-api-production.up.railway.app`.
4. Set service variables (Railway → Variables):

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Same as Pages / local |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only |
| `ALERT_JOB_TOKEN` | Yes | Long random secret; same value as GitHub secret |
| `API_CORS_ORIGINS` | Yes | `https://rigscout.co,https://www.rigscout.co` |
| `ENVIRONMENT` | Recommended | `production` |
| `SMTP_*` | Optional | Email alerts |

5. Confirm health: `curl -sS https://<your-api-host>/health`
6. Wire GitHub (repository **Settings → Secrets and variables → Actions**):

| Kind | Name | Value |
|------|------|-------|
| Variable | `API_BASE_URL` | `https://<your-api-host>` (no trailing slash) |
| Secret | `ALERT_JOB_TOKEN` | Same token as Railway |
| Variable | `VITE_API_BASE_URL` | Same URL (so the Pages build talks to production API) |

7. Run **Evaluate price alerts** manually (**Actions → Evaluate price alerts → Run workflow**) and confirm HTTP 200.

Local smoke (before hosting):

```bash
export ALERT_JOB_TOKEN=dev-token
# API process must have the same token
curl -X POST http://127.0.0.1:8000/v1/jobs/evaluate-alerts \
  -H "X-Job-Token: dev-token"
```

## CORS

Production `API_CORS_ORIGINS` must include the Pages origin(s):

```text
https://rigscout.co,https://www.rigscout.co
```

Add local origins only on a non-production service.

## Docker (local verify)

```bash
cd apps/api
docker build -t rigscout-api .
docker run --rm -p 8000:8000 \
  -e SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY \
  -e ALERT_JOB_TOKEN \
  -e API_CORS_ORIGINS=http://localhost:5173,https://rigscout.co \
  rigscout-api
```

## Status

- [x] Dockerfile + Railway config in repo
- [x] Live Railway service URL: `https://api-production-8587.up.railway.app`
- [x] GitHub `API_BASE_URL` + `ALERT_JOB_TOKEN` set
- [x] Pages `VITE_API_BASE_URL` pointed at hosted API (redeploy Pages to pick up the variable)

Project dashboard: [RigScout on Railway](https://railway.com/project/cbef8716-03e4-4991-b4f0-be0e42fa6264)  
Service root directory: `apps/api` (GitHub `DekuWorks/RigScout` → `main`).
