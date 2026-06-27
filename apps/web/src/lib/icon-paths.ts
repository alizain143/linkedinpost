/** Public SVG and raster asset paths — single source of truth. */
export const ICON_PATHS = {
  // OAuth / auth
  google: "/icons/google.svg",
  apple: "/icons/apple.svg",
  linkedin: "/icons/linkedin.svg",

  // Brand marks
  favicon: "/icons/favicon.svg",
  logoMarkSymbol: "/icons/logo-mark-symbol.svg",
  logoMarkViolet: "/icons/logo-mark-violet.svg",
  logoMarkInk: "/icons/logo-mark-ink.svg",
  logoMarkWhite: "/icons/logo-mark-white.svg",

  // Raster fallbacks (PWA, OG, legacy)
  faviconPng16: "/icons/favicon-16.png",
  faviconPng32: "/icons/favicon-32.png",
  faviconPng48: "/icons/favicon-48.png",
  appIcon180: "/icons/app-icon-180.png",
  appIcon192: "/icons/app-icon-192.png",
  appIcon512: "/icons/app-icon-512.png",
  ogImage: "/icons/og-image.png",
  markVioletPng: "/icons/mark-violet-512.png",
  markInkPng: "/icons/mark-ink-512.png",
  markWhitePng: "/icons/mark-white-512.png",
} as const;

const MATERIAL_ICON_DIR = "/icons/material";

/** Path to a Material Symbol SVG file in public/icons/material/. */
export function materialIconPath(name: string): string {
  return `${MATERIAL_ICON_DIR}/${name}.svg`;
}
