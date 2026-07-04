#!/usr/bin/env bash
# Deploy linkedinpost backend to a single AWS EC2 instance.
#
# Prerequisites (one-time, AWS Console):
#   1. Launch free-tier EC2 (t3.micro / t2.micro), Ubuntu 24.04, public IP
#   2. Security group: 22 (your IP), 80, 443 from 0.0.0.0/0
#   3. Point API_DOMAIN A record → EC2 public IP
#
# Usage:
#   cp deploy/aws/config.env.example deploy/aws/config.env
#   cp apps/backend/.env.example deploy/aws/.env
#   # fill in both files
#   ./deploy/aws/deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="$ROOT/deploy/aws"
CONFIG_FILE="$DEPLOY_DIR/config.env"
ENV_FILE="$DEPLOY_DIR/.env"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Missing $CONFIG_FILE — copy config.env.example and fill it in."
  exit 1
fi

# shellcheck source=/dev/null
source "$CONFIG_FILE"

SSH_KEY="${SSH_KEY/#\~/$HOME}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)

remote() {
  ssh "${SSH_OPTS[@]}" "$APP_SSH" "$@"
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy apps/backend/.env.example to deploy/aws/.env and add secrets."
  exit 1
fi

echo "→ Building backend locally (t3.micro cannot run nest build)"
(
  cd "$ROOT"
  npm run build -w backend
)

if [[ ! -d "$ROOT/apps/backend/dist" ]]; then
  echo "Build failed — apps/backend/dist missing"
  exit 1
fi

echo "→ Bootstrapping $APP_SSH"
scp "${SSH_OPTS[@]}" "$DEPLOY_DIR/remote/bootstrap.sh" "$APP_SSH:/tmp/bootstrap.sh"
remote "bash /tmp/bootstrap.sh"

echo "→ Syncing repo (includes pre-built dist)"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude node_modules \
  --exclude .git \
  --exclude apps/web/.next \
  --exclude apps/web/node_modules \
  --exclude .env \
  --exclude 'deploy/aws/config.env' \
  --exclude 'apps/backend/coverage' \
  "$ROOT/" "$APP_SSH:~/linkedinpost"

# Build runtime .env (infra vars override anything in secrets file)
# Use two temp files — writing to the same file we read truncates secrets.
tmp_base="$(mktemp)"
tmp_out="$(mktemp)"
grep -v '^DATABASE_URL=' "$ENV_FILE" \
  | grep -v '^REDIS_URL=' \
  | grep -v '^PORT=' \
  | grep -v '^NODE_ENV=' \
  | grep -v '^FRONTEND_URL=' \
  | grep -v '^POSTGRES_USER=' \
  | grep -v '^POSTGRES_PASSWORD=' \
  | grep -v '^POSTGRES_DB=' > "$tmp_base" || true

# URL-encode password for DATABASE_URL (handles +, /, =, etc.)
POSTGRES_PASSWORD_ENC="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$POSTGRES_PASSWORD")"

{
  cat "$tmp_base"
  echo "POSTGRES_USER=${POSTGRES_USER}"
  echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
  echo "POSTGRES_DB=${POSTGRES_DB}"
  echo "DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD_ENC}@postgres:5432/${POSTGRES_DB}?schema=public"
  echo "REDIS_URL=redis://redis:6379"
  echo "PORT=3001"
  echo "NODE_ENV=production"
  echo "FRONTEND_URL=${FRONTEND_URL}"
} > "$tmp_out"

scp "${SSH_OPTS[@]}" "$tmp_out" "$APP_SSH:~/linkedinpost/deploy/aws/.env"
rm -f "$tmp_base" "$tmp_out"

sed "s/api.example.com/${API_DOMAIN}/g" "$DEPLOY_DIR/Caddyfile" \
  | remote "cat > ~/linkedinpost/deploy/aws/Caddyfile"

echo "→ Building and starting stack"
remote "cd ~/linkedinpost/deploy/aws && docker compose build"
remote "cd ~/linkedinpost/deploy/aws && docker compose run --rm api prisma migrate deploy"
remote "cd ~/linkedinpost/deploy/aws && docker compose up -d"

echo ""
echo "✓ Deployed — https://${API_DOMAIN}"
echo "  Swagger: https://${API_DOMAIN}/docs"
echo "  Clerk webhook: https://${API_DOMAIN}/v1/auth/webhooks/clerk"
echo "  XPay webhook: https://${API_DOMAIN}/v1/billing/webhooks/xpay"
echo ""
echo "Set NEXT_PUBLIC_API_URL=https://${API_DOMAIN} in Vercel."
