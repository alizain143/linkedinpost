#!/usr/bin/env bash
# Package the LinkedIn import Chrome extension for Chrome Web Store upload.
#
# Usage:
#   ./deploy/extension/package.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EXT_DIR="$ROOT/apps/linkedin-import-extension"
OUT_DIR="$ROOT/deploy/extension/dist"

if [[ ! -f "$EXT_DIR/manifest.json" ]]; then
  echo "Missing $EXT_DIR/manifest.json"
  exit 1
fi

VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$EXT_DIR/manifest.json','utf8')).version")"
ZIP="$OUT_DIR/linkedinpost-import-v${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$ZIP"

(
  cd "$EXT_DIR"
  zip -r "$ZIP" \
    manifest.json \
    popup.html \
    popup.js \
    content.js \
    parser.js \
    capture.js \
    import-progress.js \
    app-bridge.js \
    background.js \
    icons/ \
    -x "*.DS_Store"
)

echo "✓ Packaged $ZIP ($(du -h "$ZIP" | cut -f1))"
