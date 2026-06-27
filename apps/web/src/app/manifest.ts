import type { MetadataRoute } from "next";
import { APPLE_ICON_PATH, FAVICON_PATHS } from "@/lib/brand";
import { ICON_PATHS } from "@/lib/icon-paths";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "linkedinpost",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: THEME_COLOR,
    icons: [
      {
        src: FAVICON_PATHS.svg,
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: ICON_PATHS.appIcon192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: ICON_PATHS.appIcon512,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: APPLE_ICON_PATH,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
