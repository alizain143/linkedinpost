# linkedinpost Profile Import Extension

User-initiated Chrome extension (Manifest V3) that reads the LinkedIn profile page you are viewing and sends structured data to linkedinpost.ai.

## Install locally (development)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this folder: `apps/linkedin-import-extension` in the repo
5. Pin the extension from the puzzle icon in the toolbar

## Use with linkedinpost

1. In linkedinpost go to **Settings → Connections → Import full profile**
2. Copy the **workspace ID** and **import token** (or click **Open LinkedIn profile**)
3. Open your LinkedIn profile in Chrome (`linkedin.com/in/your-slug`)
4. Click the linkedinpost extension icon → verify API URL (`http://localhost:3001/v1` in dev) → **Import profile**
5. Back in linkedinpost, click **I've imported — refresh** or reload Settings

## Publish to Chrome Web Store (production)

1. **Google developer account** — pay the one-time [Chrome Web Store developer registration fee](https://chrome.google.com/webstore/devconsole) (~$5)
2. **Prepare listing assets** — name, description, 128×128 icon, screenshots (1280×800 or 640×400), privacy policy URL on your domain
3. **Zip the extension** — from repo root:
   ```bash
   cd apps/linkedin-import-extension
   zip -r linkedinpost-import.zip manifest.json popup.html popup.js content.js parser.js background.js README.md
   ```
4. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item** → upload the zip
5. Fill **Privacy practices** — declare that data is sent only on user click to your API; no LinkedIn cookies collected
6. Set **host permissions** justification: `linkedin.com/in/*` to read profile page user is viewing; your API host to POST imported fields
7. Submit for **review** (typically a few days to 2 weeks)
8. After approval, add the Web Store URL to the import modal in the web app

## Update an published extension

1. Bump `"version"` in `manifest.json`
2. Create a new zip and upload in the developer dashboard
3. Submit update for review
