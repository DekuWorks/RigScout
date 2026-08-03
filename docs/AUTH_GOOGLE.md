# Google SSO (production)

Production Supabase project: `tygapixcdiovpdgfqros`  
Dashboard: https://supabase.com/dashboard/project/tygapixcdiovpdgfqros

## Already configured

- Hosted project created, migrations + seed applied
- GitHub Pages secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Auth Site URL: `https://rigscout.co`
- Redirect allow list includes `https://rigscout.co/**` and local Vite origins
- Google provider **enabled** in Supabase Auth

## Create a fresh Google OAuth Web client

The previous client ID returned `deleted_client` — create a new one:

1. Open [Create OAuth client](https://console.cloud.google.com/auth/clients/create?project=schedura-473723) (or any GCP project you own).
2. Application type: **Web application**
3. Name: `RigScout Web`
4. **Authorized JavaScript origins**
   - `https://rigscout.co`
   - `https://tygapixcdiovpdgfqros.supabase.co`
   - `http://127.0.0.1:5173` (local)
5. **Authorized redirect URIs**
   - `https://tygapixcdiovpdgfqros.supabase.co/auth/v1/callback`
6. Create → copy **Client ID** and **Client secret**
7. Paste **Client ID** + **Client secret** into Supabase → Auth → Providers → Google.

Wired in Supabase Auth → Google:

| Field | Value |
|-------|--------|
| Client ID | `432318329663-pe5do9i23fsp2ui0og2s4uitgbhjuql9.apps.googleusercontent.com` |
| Client secret | set (stored only in Supabase; never commit) |
| Callback URL | `https://tygapixcdiovpdgfqros.supabase.co/auth/v1/callback` |

Confirm the callback URL is listed under **Authorized redirect URIs** on that Google Cloud client.

## Local demo email login (optional)

Production has **no** demo users. For local RLS/UI checks only, apply `supabase/seed_demo.sql` after `db reset`, then:

| Email | Password |
|-------|----------|
| `demo@rigscout.local` | `password123` |
| `scout@rigscout.local` | `password123` |

Otherwise create a real account (email or Google SSO).

## Local vs production `.env`

Keep local Docker / Vite keys in repo-root `.env` for development. Production keys live in GitHub Actions secrets and the hosted API provider (Railway Variables). Never commit either file.
