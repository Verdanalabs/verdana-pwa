#!/usr/bin/env bash
# deploy.sh — Verdana PWA deployment entrypoint
#
# Usage:
#   ./deploy.sh --variant collector
#   ./deploy.sh --variant collector --prod
#   ./deploy.sh --variant pvp
#   ./deploy.sh --variant pvp --prod --skip-build

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}${BOLD}▶ $*${RESET}"; }
ok()   { echo -e "${GREEN}✔ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $*${RESET}"; }
err()  { echo -e "${RED}✖ $*${RESET}" >&2; exit 1; }

VARIANT=""
TARGET_ENV="staging"
SKIP_BUILD=false

while [ "$#" -gt 0 ]; do
  case "$1" in
    --variant)
      [ "$#" -ge 2 ] || err "--variant requires a value"
      VARIANT="$2"
      shift 2
      ;;
    --variant=*)
      VARIANT="${1#*=}"
      shift
      ;;
    --prod)
      TARGET_ENV="production"
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --help|-h)
      sed -n '1,8p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      err "Unknown flag: $1"
      ;;
  esac
done

case "$VARIANT" in
  collector|pvp) ;;
  *) err "Invalid or missing --variant. Use 'collector' or 'pvp'." ;;
esac

APP_DOMAIN_PRODUCTION="https://app.verdanaprotocol.com"
APP_DOMAIN_STAGING="https://staging-app.verdanaprotocol.com"
PVP_DOMAIN_PRODUCTION="https://pvp.verdanaprotocol.com"
PVP_DOMAIN_STAGING="https://staging-pvp.verdanaprotocol.com"

if [ "$VARIANT" = "collector" ]; then
  BUILD_SCRIPT="build:web:app"
  if [ "$TARGET_ENV" = "production" ]; then
    PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_APP:-verdana-pwa-app}"
    DOMAIN="$APP_DOMAIN_PRODUCTION"
    ENV_CANDIDATES=(".env.app.production" ".env.production")
  else
    PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_APP_STAGING:-verdana-pwa-app-staging}"
    DOMAIN="$APP_DOMAIN_STAGING"
    ENV_CANDIDATES=(".env.app.staging" ".env.staging")
  fi
else
  BUILD_SCRIPT="build:web:pvp"
  if [ "$TARGET_ENV" = "production" ]; then
    PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_PVP:-verdana-pwa-pvp}"
    DOMAIN="$PVP_DOMAIN_PRODUCTION"
    ENV_CANDIDATES=(".env.pvp.production" ".env.production")
  else
    PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_PVP_STAGING:-verdana-pwa-pvp-staging}"
    DOMAIN="$PVP_DOMAIN_STAGING"
    ENV_CANDIDATES=(".env.pvp.staging" ".env.staging")
  fi
fi

if [ "$TARGET_ENV" = "production" ]; then
  DEFAULT_COLLECTOR_PUBLIC_URL="$APP_DOMAIN_PRODUCTION"
  DEFAULT_PVP_PUBLIC_URL="$PVP_DOMAIN_PRODUCTION"
else
  DEFAULT_COLLECTOR_PUBLIC_URL="$APP_DOMAIN_STAGING"
  DEFAULT_PVP_PUBLIC_URL="$PVP_DOMAIN_STAGING"
fi

ENV_FILE=""
for candidate in "${ENV_CANDIDATES[@]}"; do
  if [ -f "$candidate" ]; then
    ENV_FILE="$candidate"
    break
  fi
done

[ -n "$ENV_FILE" ] || err "No env file found. Checked: ${ENV_CANDIDATES[*]}"

log "Loading ${ENV_FILE}..."
set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport
ok "Env loaded."

command -v node >/dev/null 2>&1 || err "node not found."
command -v npm  >/dev/null 2>&1 || err "npm not found."
command -v npx  >/dev/null 2>&1 || err "npx not found."

[ -z "${CLOUDFLARE_API_TOKEN:-}" ]  && err "CLOUDFLARE_API_TOKEN is not set in ${ENV_FILE}."
[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] && err "CLOUDFLARE_ACCOUNT_ID is not set in ${ENV_FILE}."

export EXPO_PUBLIC_COLLECTOR_APP_URL="${EXPO_PUBLIC_COLLECTOR_APP_URL:-$DEFAULT_COLLECTOR_PUBLIC_URL}"
export EXPO_PUBLIC_PVP_APP_URL="${EXPO_PUBLIC_PVP_APP_URL:-$DEFAULT_PVP_PUBLIC_URL}"

echo ""
echo -e "${BOLD}  Variant :${RESET} ${VARIANT}"
echo -e "${BOLD}  Target  :${RESET} ${TARGET_ENV}"
echo -e "${BOLD}  Project :${RESET} ${PROJECT_NAME}"
echo -e "${BOLD}  Domain  :${RESET} ${DOMAIN}"
echo ""

if [ "$SKIP_BUILD" = false ]; then
  log "[1/2] Building web export via ${BUILD_SCRIPT}..."
  npm run "$BUILD_SCRIPT"
  ok "Build complete → dist/"
else
  warn "Skipping build (--skip-build)"
  [ -d "dist" ] || err "Build output 'dist/' not found. Run without --skip-build first."
fi

log "[2/2] Deploying to Cloudflare Pages..."
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
npx wrangler pages deploy dist \
  --project-name="$PROJECT_NAME" \
  --branch=main \
  --commit-dirty=true

echo ""
ok "Deployed → ${DOMAIN}"
