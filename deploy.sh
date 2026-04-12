#!/usr/bin/env bash
# deploy.sh — Verdana PWA · Cloudflare Pages deployment
#
# Usage:
#   ./deploy.sh             → staging  (staging.verdanaprotocol.com)
#   ./deploy.sh --prod      → production (app.verdanaprotocol.com)
#   ./deploy.sh --skip-build  → skip build, deploy existing dist/
# ──────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}${BOLD}▶ $*${RESET}"; }
ok()   { echo -e "${GREEN}✔ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $*${RESET}"; }
err()  { echo -e "${RED}✖ $*${RESET}" >&2; exit 1; }

# ─── Config ────────────────────────────────────────────────────────────────────
STAGING_PROJECT="verdana-pwa-staging"
PROD_PROJECT="verdana-pwa"
BUILD_OUTPUT="dist"

# ─── Parse flags ───────────────────────────────────────────────────────────────
PROD=false
SKIP_BUILD=false

for arg in "$@"; do
  case $arg in
    --prod)       PROD=true ;;
    --skip-build) SKIP_BUILD=true ;;
    --help|-h)
      grep '^#' "$0" | head -10 | sed 's/^# \?//'
      exit 0
      ;;
    *) err "Unknown flag: $arg" ;;
  esac
done

# ─── Load env file ─────────────────────────────────────────────────────────────
if [ "$PROD" = true ]; then
  ENV_FILE=".env.production"
  TARGET_ENV="PRODUCTION"
  PROJECT_NAME="$PROD_PROJECT"
  DOMAIN="app.verdanaprotocol.com"
else
  ENV_FILE=".env.staging"
  TARGET_ENV="STAGING"
  PROJECT_NAME="$STAGING_PROJECT"
  DOMAIN="staging-app.verdanaprotocol.com"
fi

[ -f "$ENV_FILE" ] || err "Env file '${ENV_FILE}' not found. Copy .env.example and fill in values."

log "Loading ${ENV_FILE}..."
set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport
ok "Env loaded."

# ─── Preflight checks ──────────────────────────────────────────────────────────
log "Running preflight checks..."

command -v node     >/dev/null 2>&1 || err "node not found."
command -v npm      >/dev/null 2>&1 || err "npm not found."
command -v npx      >/dev/null 2>&1 || err "npx not found."

[ -z "${CLOUDFLARE_API_TOKEN:-}" ]  && err "CLOUDFLARE_API_TOKEN is not set in ${ENV_FILE}."
[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] && err "CLOUDFLARE_ACCOUNT_ID is not set in ${ENV_FILE}."

ok "Preflight passed."

# ─── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  Target  :${RESET} ${TARGET_ENV}"
echo -e "${BOLD}  Project :${RESET} ${PROJECT_NAME}"
echo -e "${BOLD}  Domain  :${RESET} ${DOMAIN}"
echo ""

# ─── Build ─────────────────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  log "[1/2] Building Expo web export..."
  npm run build:web
  ok "Build complete → ${BUILD_OUTPUT}/"
else
  warn "Skipping build (--skip-build)"
  [ -d "$BUILD_OUTPUT" ] || err "Build output '${BUILD_OUTPUT}/' not found. Run without --skip-build first."
fi

# ─── Deploy ────────────────────────────────────────────────────────────────────
log "[2/2] Deploying to ${TARGET_ENV}..."

CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
npx wrangler pages deploy "$BUILD_OUTPUT" \
  --project-name="$PROJECT_NAME" \
  --branch=main \
  --commit-dirty=true

echo ""
ok "Deployed → https://${DOMAIN}"
