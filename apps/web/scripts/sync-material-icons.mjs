#!/usr/bin/env node
/**
 * Downloads Material Symbols (rounded) SVGs used in the app into public/icons/material/.
 * Run: node scripts/sync-material-icons.mjs
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const outDir = join(webRoot, "public", "icons", "material");
const srcRoot = join(webRoot, "src");

/** Icons referenced in source — keep in sync when adding new MsIcon names. */
const ICONS = [
  "account_tree",
  "add",
  "arrow_back",
  "arrow_forward",
  "auto_awesome",
  "auto_awesome_motion",
  "auto_mode",
  "badge",
  "bolt",
  "bookmark_add",
  "bookmark_added",
  "calendar_month",
  "cancel",
  "check",
  "check_circle",
  "chevron_left",
  "chevron_right",
  "close",
  "content_copy",
  "credit_card",
  "dashboard",
  "delete",
  "done_all",
  "download",
  "draft",
  "edit",
  "error",
  "event_available",
  "event_busy",
  "expand_more",
  "fact_check",
  "fingerprint",
  "groups",
  "help",
  "hourglass_empty",
  "how_to_reg",
  "image",
  "lightbulb",
  "link",
  "link_off",
  "lock",
  "logout",
  "mail",
  "mark_email_read",
  "mark_email_unread",
  "menu",
  "notifications",
  "open_in_new",
  "pause",
  "pause_circle",
  "person_add",
  "person_remove",
  "photo_camera",
  "play_arrow",
  "progress_activity",
  "rate_review",
  "receipt",
  "refresh",
  "rss_feed",
  "schedule",
  "search",
  "send",
  "settings",
  "shield_lock",
  "smart_toy",
  "star",
  "sync_alt",
  "task_alt",
  "touch_app",
  "trending_up",
  "tune",
  "unfold_more",
  "verified_user",
  "warning",
  "workspace_premium",
  "workspaces",
];

async function discoverIconsFromSource() {
  const found = new Set(ICONS);
  const files = await walkDir(srcRoot);
  const patterns = [
    /name="([a-z][a-z0-9_]*)"/g,
    /icon:\s*"([a-z][a-z0-9_]*)"/g,
    /icon:\s*'([a-z][a-z0-9_]*)'/g,
    /showToast\([^,]+,\s*"([a-z][a-z0-9_]*)"/g,
  ];

  for (const file of files) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    const text = await readFile(file, "utf8");
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text))) {
        const name = match[1];
        if (/^[a-z][a-z0-9_]*$/.test(name)) found.add(name);
      }
    }
  }

  return [...found].sort();
}

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkDir(path)));
    else files.push(path);
  }
  return files;
}

function iconifySlugs(name) {
  const kebab = name.replaceAll("_", "-");
  return [`${kebab}-rounded`, kebab];
}

async function fetchIcon(name) {
  let lastError = "";
  for (const slug of iconifySlugs(name)) {
    const url = `https://api.iconify.design/material-symbols/${slug}.svg`;
    const res = await fetch(url);
    if (res.ok) return res.text();
    lastError = `HTTP ${res.status}`;
  }
  throw new Error(`${name}: ${lastError}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const icons = await discoverIconsFromSource();
  let ok = 0;
  const failed = [];

  for (const name of icons) {
    try {
      const svg = await fetchIcon(name);
      await writeFile(join(outDir, `${name}.svg`), svg, "utf8");
      ok += 1;
    } catch (err) {
      failed.push({ name, error: err.message });
    }
  }

  console.log(`Synced ${ok}/${icons.length} icons to public/icons/material/`);
  if (failed.length) {
    console.error("Failed:");
    for (const f of failed) console.error(`  ${f.name}: ${f.error}`);
    process.exit(1);
  }
}

main();
