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
WEB_ASSET_PREFIX_OLD="/assets/node_modules/"
WEB_ASSET_PREFIX_NEW="/assets/vendor/"

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

rewrite_web_assets() {
  local assets_root="${BUILD_OUTPUT}/assets"
  local old_dir="${assets_root}/node_modules"
  local new_dir="${assets_root}/vendor"

  [ -d "$old_dir" ] || return 0

  log "Rewriting web asset paths to avoid deploy ignore rules..."
  rm -rf "$new_dir"
  mv "$old_dir" "$new_dir"

  node -e '
    const fs = require("fs");
    const path = require("path");
    const root = process.argv[1];
    const from = process.argv[2];
    const to = process.argv[3];
    const exts = new Set([".html", ".js", ".map", ".css"]);

    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!exts.has(path.extname(entry.name))) continue;
        const source = fs.readFileSync(full, "utf8");
        if (!source.includes(from)) continue;
        fs.writeFileSync(full, source.split(from).join(to));
      }
    }

    walk(root);
  ' "$BUILD_OUTPUT" "$WEB_ASSET_PREFIX_OLD" "$WEB_ASSET_PREFIX_NEW"

  ok "Asset paths rewritten."
}

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
  rewrite_web_assets
  ok "Build complete → ${BUILD_OUTPUT}/"
else
  warn "Skipping build (--skip-build)"
  [ -d "$BUILD_OUTPUT" ] || err "Build output '${BUILD_OUTPUT}/' not found. Run without --skip-build first."
  rewrite_web_assets
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
