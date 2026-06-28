import { ICON_PATHS } from "@/lib/icon-paths";
import { THEME_COLOR } from "@/lib/site";

/** Shared Clerk UI branding (sign-in, reverification modal, etc.). */
export const clerkAppearance = {
  options: {
    logoImageUrl: ICON_PATHS.appIcon192,
    logoLinkUrl: "/",
  },
  variables: {
    colorPrimary: THEME_COLOR,
    borderRadius: "0.75rem",
  },
} as const;
