# Google SSO (production)

Production Supabase project: `tygapixcdiovpdgfqros`  
Dashboard: https://supabase.com/dashboard/project/tygapixcdiovpdgfqros

## Already configured

- Hosted project created, migrations + seed applied
- GitHub Pages secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Auth Site URL: `https://rigscout.co`
- Redirect allow list includes `https://rigscout.co/**` and local Vite origins
- Google provider **enabled** in Supabase Auth

## Required Google Cloud step (one-time)

Google must allow Supabase’s callback URL on the OAuth client.

1. Open [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=schedura-473723) (or your preferred GCP project).
2. Edit the OAuth 2.0 Web client used for RigScout.
3. Under **Authorized redirect URIs**, add:

```
https://tygapixcdiovpdgfqros.supabase.co/auth/v1/callback
```

4. Under **Authorized JavaScript origins**, add:

```
https://tygapixcdiovpdgfqros.supabase.co
https://rigscout.co
```

5. Save. Wait 1–5 minutes, then try **Continue with Google** on https://rigscout.co/login.

## Demo email login

Seeded accounts (after remote seed):

| Email | Password |
|-------|----------|
| `demo@rigscout.local` | `password123` |
| `scout@rigscout.local` | `password123` |

## Local vs production `.env`

Keep local Docker keys in repo-root `.env` for development. Production keys live in GitHub Actions secrets and `~/.config/rigscout/production.env` (never commit).
