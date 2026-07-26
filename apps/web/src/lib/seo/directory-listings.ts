/**
 * Tier 1 directory listing copy for Week 1 outreach.
 * Rotate variants. Never paste the same description twice across directories.
 * Submit manually (no bulk services). Link Tier 1 to homepage; Tier 2+ can deep-link /tools or /compare.
 */

export const DIRECTORY_LISTINGS_WEEK1 = [
  {
    platform: "There's An AI For That (TAAFT)",
    url: "https://theresanaiforthat.com",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
  },
  {
    platform: "Crunchbase",
    url: "https://www.crunchbase.com",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
  },
  {
    platform: "AlternativeTo",
    url: "https://alternativeto.net",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
    note: "List as alternative to Taplio / AuthoredUp where relevant.",
  },
  {
    platform: "SaaSHub",
    url: "https://www.saashub.com",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
  },
  {
    platform: "Futurepedia",
    url: "https://www.futurepedia.io",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
  },
  {
    platform: "Toolify",
    url: "https://www.toolify.ai",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
  },
  {
    platform: "Indie Hackers",
    url: "https://www.indiehackers.com",
    primaryLink: "https://linkedinpost.ai",
    status: "todo" as const,
    note: "Product page + build-in-public updates.",
  },
] as const;

/** Four length variants. Rotate across directories. */
export const DIRECTORY_DESCRIPTION_VARIANTS = {
  short50:
    "AI LinkedIn posts that sound like you: voice profiles, review council, calendars, approve before publish.",
  medium100:
    "linkedinpost.ai helps founders and agencies create LinkedIn content that still sounds human. Build a voice profile, generate drafts with an AI Content Council, review media, and approve before anything schedules or publishes. Free plan available.",
  long200:
    "linkedinpost.ai is a LinkedIn content system for founders, creators, and agencies. Instead of one-shot AI prompts, you capture voice once, generate with a multi-agent council (writer, reviewer, editor), then approve before schedule or publish. Pro adds a 30-day calendar. Agency adds client workspaces so brands stay separate. Start free with monthly credits, no credit card required. Also free ungated tools: character counter and text formatter.",
  long400:
    "Most LinkedIn AI tools give you a first draft that could belong to anyone. linkedinpost.ai is built for the opposite outcome: posts that still sound like you.\n\nYou set a voice profile (role, audience, pillars, avoid-list). An AI Content Council drafts and challenges weak lines before you see a package. You approve, then schedule or publish. Pro unlocks a 30-day content calendar. Agency adds up to five client workspaces so Client A never sounds like Client B.\n\nPricing starts at $0 (Free), then Starter, Pro, and Agency. Check linkedinpost.ai/pricing for current numbers.\n\nIf you are comparing Taplio, Buffer, or AuthoredUp, read our honest comparisons and alternatives pages. For quick utilities with no signup, try the LinkedIn character counter and Unicode text formatter under /tools.\n\nNot affiliated with or endorsed by LinkedIn Corporation.",
} as const;

export const DIRECTORY_TAGLINE =
  "AI LinkedIn content that sounds like you, with review before publish.";

export const DIRECTORY_CATEGORIES = [
  "LinkedIn",
  "AI Writing",
  "Content Marketing",
  "Social Media",
  "SaaS",
] as const;
