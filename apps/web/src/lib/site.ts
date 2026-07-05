/** Site-wide config. Switch domain via NEXT_PUBLIC_SITE_URL when going live. */
export const SITE_NAME = "linkedinpost.ai";
export const SITE_TAGLINE =
  "Create a month of LinkedIn content in minutes with AI";
export const SITE_TITLE_DEFAULT =
  "linkedinpost.ai | Create a Month of LinkedIn Content in Minutes with AI";
export const SITE_DESCRIPTION =
  "linkedinpost.ai is the AI LinkedIn content engine for founders, creators, and agencies. Generate authentic posts, plan a 30-day content calendar, and schedule without sounding like generic AI. Start free, no credit card.";
export const SITE_KEYWORDS = [
  "LinkedIn post generator",
  "AI LinkedIn content",
  "LinkedIn content calendar",
  "LinkedIn AI writer",
  "personal branding tool",
  "LinkedIn scheduling",
  "content creation for founders",
];
export const OG_IMAGE_ALT =
  "linkedinpost.ai AI LinkedIn content engine dashboard";
export const LEGAL_ENTITY = "linkedinpost.ai";
export const THEME_COLOR = "#5B3DF5";

export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
    } catch {
      /* fall through */
    }
  }
  return new URL("https://linkedinpost.ai");
}

export function isIndexingAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";
}

export const TWITTER_HANDLE = "@linkedinpostai";
export const TWITTER_URL = "https://x.com/linkedinpostai";
export const LINKEDIN_COMPANY_URL =
  "https://www.linkedin.com/company/linkedinpost-ai";

export function socialProfileUrls(): string[] {
  return [TWITTER_URL, LINKEDIN_COMPANY_URL];
}

export const FOOTER_SOCIAL = [
  {
    icon: "groups",
    href: LINKEDIN_COMPANY_URL,
    label: "LinkedIn community",
    external: true,
  },
  {
    icon: "mail",
    href: "/contact",
    label: "Contact us",
    external: false,
  },
  {
    icon: "rss_feed",
    href: TWITTER_URL,
    label: "Product updates",
    external: true,
  },
] as const;
