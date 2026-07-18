import { getSiteUrl, isIndexingAllowed } from "@/lib/site";

const DISALLOW_PATHS = [
  "/app/",
  "/sign-in",
  "/sign-up",
  "/approve/",
  "/billing",
] as const;

/** AI crawlers that need explicit User-agent blocks (isitagentready ai-rules). */
export const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "Claude-Web",
  "Google-Extended",
  "Amazonbot",
  "anthropic-ai",
  "Bytespider",
  "CCBot",
  "Applebot-Extended",
] as const;

export const CONTENT_SIGNAL =
  "search=yes, ai-train=no, ai-input=yes" as const;

function ruleBlock(userAgent: string, disallowAll: boolean): string {
  const lines = [`User-agent: ${userAgent}`];

  if (disallowAll) {
    lines.push("Disallow: /");
  } else {
    lines.push("Allow: /");
    for (const path of DISALLOW_PATHS) {
      lines.push(`Disallow: ${path}`);
    }
    lines.push(`Content-Signal: ${CONTENT_SIGNAL}`);
  }

  return lines.join("\n");
}

/** Plain-text robots.txt body per RFC 9309 + Content Signals. */
export function buildRobotsTxt(options?: {
  origin?: string;
  indexingAllowed?: boolean;
}): string {
  const origin = options?.origin ?? getSiteUrl().origin;
  const indexingAllowed = options?.indexingAllowed ?? isIndexingAllowed();
  const disallowAll = !indexingAllowed;

  const blocks = [
    ruleBlock("*", disallowAll),
    ...AI_USER_AGENTS.map((ua) => ruleBlock(ua, disallowAll)),
  ];

  return `${blocks.join("\n\n")}\n\nSitemap: ${origin}/sitemap.xml\n`;
}
