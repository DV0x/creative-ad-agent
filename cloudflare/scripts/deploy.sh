#!/usr/bin/env bash
# Deploy worker to Cloudflare AND upload source maps to Sentry.
# Usage: bash scripts/deploy.sh <staging|production>

set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "Usage: $0 <staging|production>" >&2
  exit 1
fi

# Load SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT from workspace .env.local
ROOT_ENV_FILE="$(cd "$(dirname "$0")/../.." && pwd)/.env.local"
if [[ -f "$ROOT_ENV_FILE" ]]; then
  set -a
  source "$ROOT_ENV_FILE"
  set +a
fi

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "SENTRY_AUTH_TOKEN not set; cannot upload source maps" >&2
  exit 1
fi

# Propose a release name (uses git SHA when available, falls back to timestamp)
SENTRY_RELEASE="$(npx sentry-cli releases propose-version)"
echo "==> Sentry release: $SENTRY_RELEASE"
echo "==> Target env:     $ENV"

# Deploy: writes bundle + source maps to dist/, uploads maps to CF, injects SENTRY_RELEASE var
npx wrangler deploy \
  --env "$ENV" \
  --outdir dist \
  --upload-source-maps \
  --var "SENTRY_RELEASE:$SENTRY_RELEASE"

# Tell Sentry about the release (idempotent — won't error if it already exists)
npx sentry-cli releases new "$SENTRY_RELEASE"

# Upload source maps under this release name
npx sentry-cli sourcemaps upload \
  --release="$SENTRY_RELEASE" \
  --strip-prefix 'dist/..' \
  dist

echo "==> Deploy complete. Release '$SENTRY_RELEASE' on $ENV."
