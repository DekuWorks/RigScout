#!/usr/bin/env bash
# Validate that required env vars / GitHub Actions secrets are present.
# Never prints secret values — only names and pass/fail.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-local}"
FAIL=0
ENV_FILE="${ROOT}/.env"

pass() { printf "  [ok]   %s\n" "$1"; }
fail() { printf "  [MISS] %s\n" "$1"; FAIL=1; }
warn() { printf "  [warn] %s\n" "$1"; }

# True if NAME is set non-empty in process env OR assigned non-empty in .env
# (does not print or export values)
has_nonempty() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    return 0
  fi
  if [[ -f "$ENV_FILE" ]] && grep -Eq "^${name}=[^[:space:]#]+" "$ENV_FILE"; then
    return 0
  fi
  return 1
}

echo "==> RigScout env validation (mode: $MODE)"

case "$MODE" in
  local)
    if [[ ! -f "$ENV_FILE" ]]; then
      warn "No .env at repo root — checking process environment only"
    fi
    echo "Local frontend (optional until Supabase-backed auth):"
    for v in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY VITE_API_BASE_URL; do
      if has_nonempty "$v"; then pass "$v"; else warn "$v (demo mode if unset)"; fi
    done
    echo "Local API (needed for alert job / service-role paths):"
    for v in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
      if has_nonempty "$v"; then pass "$v"; else warn "$v (API jobs unavailable)"; fi
    done
    if has_nonempty "ALERT_JOB_TOKEN"; then pass "ALERT_JOB_TOKEN"; else warn "ALERT_JOB_TOKEN (job route disabled)"; fi
    if has_nonempty "API_CORS_ORIGINS"; then pass "API_CORS_ORIGINS"; else warn "API_CORS_ORIGINS (defaults in code)"; fi
    echo "Retailer APIs (optional until live ingestion):"
    if has_nonempty "BEST_BUY_API_KEY"; then pass "BEST_BUY_API_KEY"; else warn "BEST_BUY_API_KEY (Best Buy sync skipped)"; fi
    if has_nonempty "AMAZON_PAAPI_ACCESS_KEY" && has_nonempty "AMAZON_PAAPI_SECRET_KEY" && has_nonempty "AMAZON_PAAPI_PARTNER_TAG"; then
      pass "AMAZON_PAAPI_* (access + secret + partner tag)"
    else
      warn "AMAZON_PAAPI_* (Amazon sync skipped until all three set)"
    fi
    ;;
  production-checklist)
    echo "GitHub Actions secrets (names only via gh):"
    if ! command -v gh >/dev/null 2>&1; then
      fail "gh CLI not installed"
    else
      SECRETS="$(gh secret list -R DekuWorks/RigScout 2>/dev/null | awk '{print $1}' || true)"
      VARS="$(gh variable list -R DekuWorks/RigScout 2>/dev/null | awk '{print $1}' || true)"
      for s in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
        if echo "$SECRETS" | grep -qx "$s"; then pass "secret:$s"; else fail "secret:$s"; fi
      done
      if echo "$SECRETS" | grep -qx "ALERT_JOB_TOKEN"; then
        pass "secret:ALERT_JOB_TOKEN"
      else
        warn "secret:ALERT_JOB_TOKEN (set when hosted API is live)"
      fi
      for v in VITE_BASE_PATH VITE_SITE_URL; do
        if echo "$VARS" | grep -qx "$v"; then pass "var:$v"; else warn "var:$v (workflow has defaults)"; fi
      done
      for v in API_BASE_URL VITE_API_BASE_URL; do
        if echo "$VARS" | grep -qx "$v"; then
          pass "var:$v"
        else
          warn "var:$v (set when hosted API is live — see docs/API_HOSTING.md)"
        fi
      done
    fi
    echo
    echo "Manual host checklist (Railway):"
    echo "  - Deploy apps/api (Dockerfile) and note public HTTPS URL"
    echo "  - Set Railway: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALERT_JOB_TOKEN, API_CORS_ORIGINS"
    echo "  - Set GitHub variable API_BASE_URL + secret ALERT_JOB_TOKEN"
    echo "  - Optionally set variable VITE_API_BASE_URL and redeploy Pages"
    echo "  - For live prices: BEST_BUY_API_KEY and/or AMAZON_PAAPI_* then redeploy (see docs/RETAILER_ADAPTERS.md)"
    ;;
  *)
    echo "Usage: $0 [local|production-checklist]"
    exit 2
    ;;
esac

echo
if [[ "$FAIL" -ne 0 ]]; then
  echo "Result: FAILED — missing required items for mode '$MODE'"
  exit 1
fi
echo "Result: OK (warnings may remain for optional / not-yet-hosted items)"
exit 0
