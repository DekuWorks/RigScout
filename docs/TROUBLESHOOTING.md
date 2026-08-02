# Troubleshooting

## Frontend won't start

- Node 20+: `node -v`
- Install from repo root: `npm install`
- Check `.env` against `.env.example`

## Blank routes on GitHub Pages

- Confirm `VITE_BASE_PATH` matches the deployment path
- Ensure `404.html` equals `index.html` after build

## API health fails from dashboard

- Start API: `npm run dev:api`
- Confirm `VITE_API_BASE_URL=http://localhost:8000`
- Check CORS origins include your Vite origin

## Auth forms disabled

- Expected until Supabase URL + anon key are set
- Phase 2 completes Auth + protected routes

## `uv` not found

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or use a local venv + `pip install -e .` with the `dev` group dependencies listed in `apps/api/pyproject.toml`.
