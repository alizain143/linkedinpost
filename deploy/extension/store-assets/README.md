# Chrome Web Store listing assets

Upload these files in the Developer Dashboard **Store listing** tab.

| File | Use |
|------|-----|
| `store-icon-128.png` | Store icon (128×128) |
| `screenshot-1-extension-popup.png` | Screenshot — extension popup on LinkedIn |
| `screenshot-2-settings-import.png` | Screenshot — Import profile in Settings |
| `screenshot-3-review-preview.png` | Screenshot — review imported profile modal |

Regenerate:

```bash
node deploy/extension/store-assets/generate.mjs
```

Requires `sharp` (repo root) and Playwright (installed under `deploy/extension/` on first run).
