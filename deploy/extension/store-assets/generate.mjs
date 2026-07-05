#!/usr/bin/env node
/**
 * Generate Chrome Web Store listing assets.
 * Usage: node deploy/extension/store-assets/generate.mjs
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const EXT_ICONS = path.join(ROOT, "apps/linkedin-import-extension/icons");
const OUT = __dirname;

async function renderIcon() {
  const sharp = require(path.join(ROOT, "node_modules/sharp"));
  await sharp(path.join(EXT_ICONS, "logo-mark-violet.svg"))
    .resize(128, 128)
    .png()
    .toFile(path.join(OUT, "store-icon-128.png"));
  console.log("✓ store-icon-128.png");
}

async function renderScreenshots() {
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch {
    browser = await chromium.launch();
  }

  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  const mockups = [
    ["screenshot-1-extension-popup.html", "screenshot-1-extension-popup.png"],
    ["screenshot-2-settings-import.html", "screenshot-2-settings-import.png"],
    ["screenshot-3-review-preview.html", "screenshot-3-review-preview.png"],
  ];

  for (const [html, png] of mockups) {
    const fileUrl = `file://${path.join(OUT, html)}`;
    await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(150);
    await page.screenshot({
      path: path.join(OUT, png),
      type: "png",
      fullPage: false,
    });
    console.log(`✓ ${png}`);
  }

  await browser.close();
}

async function main() {
  await renderIcon();
  await renderScreenshots();
  console.log(`\nAssets written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
