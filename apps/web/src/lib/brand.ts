import { ICON_PATHS } from "./icon-paths";

export const FAVICON_PATHS = {
  svg: ICON_PATHS.favicon,
  png16: ICON_PATHS.faviconPng16,
  png32: ICON_PATHS.faviconPng32,
  png48: ICON_PATHS.faviconPng48,
} as const;

export const APPLE_ICON_PATH = ICON_PATHS.appIcon180;
export const OG_IMAGE_PATH = ICON_PATHS.ogImage;
export const LOGO_MARK_PATH = ICON_PATHS.logoMarkViolet;

export type BrandVariant = "primary" | "dark" | "light";

export function brandAssetPath(variant: BrandVariant, size = 32): string {
  if (variant === "dark") return ICON_PATHS.logoMarkInk;
  if (variant === "light") return ICON_PATHS.logoMarkWhite;
  return size <= 48 ? ICON_PATHS.favicon : ICON_PATHS.logoMarkViolet;
}
