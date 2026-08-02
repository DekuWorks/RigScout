# GitHub Pages deployment

**Canonical production domain:** [https://rigscout.co](https://rigscout.co)  
**www:** should redirect to the apex over HTTPS once GitHub’s dual-host certificate is issued.

## Enable Pages

1. Repository **Settings → Pages**
2. Source: **GitHub Actions**
3. Custom domain: `rigscout.co` (enforced HTTPS once DNS verifies and the certificate shows both hosts)
4. Push to `main`/`master` or run **Deploy GitHub Pages** manually

The build publishes `apps/web/public/CNAME` → `dist/CNAME` so Pages keeps the custom domain (`rigscout.co`).

## DNS (at your registrar — GoDaddy / domaincontrol)

Point the apex **and** www at GitHub Pages:

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
| `CNAME` | `www` | `dekuworks.github.io` |

Notes:

- Do **not** add GoDaddy “Domain Forwarding” / “Forwarding with masking” for `@` or `www` while using GitHub Pages — forwarding conflicts with Pages TLS.
- Do **not** leave parking `A` records or a second `CNAME` on `www`.
- After DNS propagates, GitHub runs a DNS check and issues a Let’s Encrypt cert covering **both** `rigscout.co` and `www.rigscout.co` (often a few minutes; sometimes longer after DNS edits). When the check succeeds, enable **Enforce HTTPS**.

## Verify DNS + TLS

```bash
# DNS
dig +short A rigscout.co
dig +short AAAA rigscout.co
dig +short CNAME www.rigscout.co   # expect: dekuworks.github.io.

# Certificate SANs (both should list rigscout.co; www should NOT be CN=*.github.io)
echo | openssl s_client -connect rigscout.co:443 -servername rigscout.co 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName
echo | openssl s_client -connect www.rigscout.co:443 -servername www.rigscout.co 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName

# Redirects (www → apex over HTTPS once cert is valid)
curl -sI https://rigscout.co | head -5
curl -sI https://www.rigscout.co | head -10

# Pages API cert state
gh api repos/DekuWorks/RigScout/pages --jq '{cname, https_enforced, cert:.https_certificate}'
```

Healthy certificate SANs look like:

```text
DNS:rigscout.co, DNS:www.rigscout.co
```

## Safari “This Connection Is Not Private” / impersonating www

**Symptom:** Phone Safari warns that the site may be impersonating `www.rigscout.co`, while `https://rigscout.co` works on desktop.

**Cause:** TLS handshake happens **before** GitHub’s www→apex redirect. If the Let’s Encrypt cert only covers the apex (or Pages is stuck re-issuing), `https://www.rigscout.co` is served with GitHub’s default `CN=*.github.io` certificate. Safari correctly rejects that hostname mismatch.

**Confirmed when broken:**

```text
curl -vI https://www.rigscout.co
# SSL: no alternative certificate subject name matches target host name 'www.rigscout.co'
# Server certificate subject: CN=*.github.io
```

**Immediate workaround (phone):** open **https://rigscout.co** (no `www`). Hard-refresh or clear Safari cache for the site if an old HSTS/error is sticky. Prefer typing the apex URL or using a bookmark to `https://rigscout.co`.

**Fix (GitHub Pages UI — required when API reports `dns_changed`):**

1. Confirm DNS table above with `dig` (no forwarding, `www` CNAME → `dekuworks.github.io`).
2. Repo **Settings → Pages → Custom domain**
3. Remove `rigscout.co`, save, wait 2–5 minutes.
4. Re-add `rigscout.co`, wait until GitHub shows a successful DNS check **and** HTTPS certificate for both hosts (not stuck on “Detected a change to DNS settings…”).
5. Enable **Enforce HTTPS**.
6. Re-check with the openssl commands above until `www` SANs include `www.rigscout.co`.

If the UI will not remove the domain because a certificate is mid-issue, wait up to an hour, or delete/recreate the Pages config (Source: GitHub Actions) and set the custom domain again, then re-run **Deploy GitHub Pages**.

**Do not** “fix” this by pointing only `www` at GoDaddy forwarding while leaving Pages on the apex — you will keep a broken dual-host setup. Either finish GitHub’s dual cert, or temporarily tell users to use the apex only.

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

Google OAuth **Authorized JavaScript origins** should include `https://rigscout.co` (apex). Add `https://www.rigscout.co` only after www has a valid certificate.

## Not used

Vercel is intentionally not configured.
