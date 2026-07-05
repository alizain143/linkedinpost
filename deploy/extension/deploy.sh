#!/usr/bin/env bash
# Package and publish the LinkedIn import extension to Chrome Web Store.
#
# First-time setup:
#   1. Register at https://chrome.google.com/webstore/devconsole (~$5 one-time)
#   2. Create the listing manually (first upload sets EXTENSION_ID)
#   3. Enable Chrome Web Store API + OAuth refresh token (see config.env.example)
#   4. cp deploy/extension/config.env.example deploy/extension/config.env
#   5. Set NEXT_PUBLIC_LINKEDIN_EXTENSION_INSTALL_URL on Vercel after approval
#
# Usage:
#   ./deploy/extension/deploy.sh          # package + publish
#   ./deploy/extension/deploy.sh --pack   # package only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.env"
PACK_ONLY=false

if [[ "${1:-}" == "--pack" ]]; then
  PACK_ONLY=true
fi

bash "$SCRIPT_DIR/package.sh"
ZIP="$(ls -t "$SCRIPT_DIR/dist"/linkedinpost-import-v*.zip 2>/dev/null | head -1)"

if [[ -z "$ZIP" ]]; then
  echo "Package step failed — zip not found"
  exit 1
fi

if $PACK_ONLY; then
  echo ""
  echo "Upload manually: https://chrome.google.com/webstore/devconsole"
  echo "  Zip: $ZIP"
  exit 0
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo ""
  echo "No $CONFIG_FILE — packaged only."
  echo "  Zip: $ZIP"
  echo ""
  echo "To publish automatically:"
  echo "  cp deploy/extension/config.env.example deploy/extension/config.env"
  echo "  # fill in Chrome Web Store API credentials"
  echo "  ./deploy/extension/deploy.sh"
  exit 0
fi

# shellcheck source=/dev/null
source "$CONFIG_FILE"

if [[ -z "${EXTENSION_ID:-}" || -z "${CLIENT_ID:-}" || -z "${CLIENT_SECRET:-}" || -z "${REFRESH_TOKEN:-}" ]]; then
  echo ""
  echo "config.env is incomplete — packaged only."
  echo "  Zip: $ZIP"
  exit 0
fi

if [[ ! -d "$SCRIPT_DIR/node_modules/chrome-webstore-upload" ]]; then
  echo "→ Installing chrome-webstore-upload"
  npm install --prefix "$SCRIPT_DIR" --no-save chrome-webstore-upload@^3.1.4
fi

export EXTENSION_ID CLIENT_ID CLIENT_SECRET REFRESH_TOKEN
node "$SCRIPT_DIR/upload.mjs" "$ZIP"

echo ""
echo "Set on Vercel (production):"
echo "  NEXT_PUBLIC_LINKEDIN_EXTENSION_INSTALL_URL=https://chromewebstore.google.com/detail/${EXTENSION_ID}"
