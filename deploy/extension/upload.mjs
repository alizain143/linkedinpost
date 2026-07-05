import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webStore from "chrome-webstore-upload";

const zipPath = process.argv[2];
const required = [
  "EXTENSION_ID",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "REFRESH_TOKEN",
];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`Missing ${key} in deploy/extension/config.env`);
    process.exit(1);
  }
}

if (!zipPath || !fs.existsSync(zipPath)) {
  console.error("Usage: node upload.mjs <path-to.zip>");
  process.exit(1);
}

const store = webStore({
  extensionId: process.env.EXTENSION_ID.trim(),
  clientId: process.env.CLIENT_ID.trim(),
  clientSecret: process.env.CLIENT_SECRET.trim(),
  refreshToken: process.env.REFRESH_TOKEN.trim(),
});

const zip = fs.readFileSync(zipPath);
const manifestPath = path.resolve(
  fileURLToPath(new URL("../../apps/linkedin-import-extension/manifest.json", import.meta.url)),
);
const version = JSON.parse(fs.readFileSync(manifestPath, "utf8")).version;

console.log(`→ Uploading ${path.basename(zipPath)} (v${version})`);
await store.uploadExisting(zip);

console.log("→ Publishing to default channel");
await store.publish();

console.log(`✓ Extension v${version} submitted`);
console.log(
  `  Store URL: https://chromewebstore.google.com/detail/${process.env.EXTENSION_ID.trim()}`,
);
