import { FAQS, FEATURE_DETAIL, PLANS, STEPS } from "@/lib/marketing-data";
import { getGuideBySlug, getPublishedGuides } from "@/lib/guides/content";
import { formatUsdPrice } from "@/lib/currency/format";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/site";
import { buildLlmsTxt } from "@/lib/agent/llms-txt";

function abs(path: string): string {
  return `${getSiteUrl().origin}${path.startsWith("/") ? path : `/${path}`}`;
}

const MARKETING_MARKDOWN_PATHS = new Set([
  "/",
  "/features",
  "/how-it-works",
  "/pricing",
  "/faq",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/guides",
]);

export function isMarketingMarkdownPath(pathname: string): boolean {
  if (MARKETING_MARKDOWN_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/guides/")) return true;
  return false;
}

/** Whether Accept prefers text/markdown over text/html. */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  const accept = acceptHeader.toLowerCase();
  if (!accept.includes("text/markdown")) return false;

  const parts = accept.split(",").map((p) => p.trim());
  let mdQ = -1;
  let htmlQ = -1;

  for (const part of parts) {
    const [type, ...params] = part.split(";").map((s) => s.trim());
    const qParam = params.find((p) => p.startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    if (Number.isNaN(q)) continue;

    if (type === "text/markdown" || type === "text/*" || type === "*/*") {
      if (type === "text/markdown") mdQ = Math.max(mdQ, q);
      else if (mdQ < 0) mdQ = Math.max(mdQ, q * 0.01);
    }
    if (type === "text/html") {
      htmlQ = Math.max(htmlQ, q);
    }
  }

  if (mdQ < 0) return false;
  if (htmlQ < 0) return true;
  return mdQ >= htmlQ;
}

export function estimateMarkdownTokens(markdown: string): number {
  // Rough heuristic (~4 chars/token) for x-markdown-tokens
  return Math.max(1, Math.ceil(markdown.length / 4));
}

export function buildPageMarkdown(pathname: string): string | null {
  if (pathname === "/") {
    return buildLlmsTxt();
  }

  if (pathname === "/features") {
    const items = FEATURE_DETAIL.map(
      (f) => `## ${f.title}\n\n${f.body}`,
    ).join("\n\n");
    return `# Features — ${SITE_NAME}\n\n${SITE_DESCRIPTION}\n\n${items}\n\n[Sign up](${abs("/sign-up")})\n`;
  }

  if (pathname === "/how-it-works") {
    const items = STEPS.map(
      (s) => `## ${s.num}. ${s.title}\n\n${s.body}`,
    ).join("\n\n");
    return `# How it works — ${SITE_NAME}\n\n${SITE_TAGLINE}\n\n${items}\n`;
  }

  if (pathname === "/pricing") {
    const plans = PLANS.map((p) => {
      const feats = p.features.map((f) => `- ${f}`).join("\n");
      return `## ${p.name} (${formatUsdPrice(p.monthlyUsd)}/mo)\n\n${p.blurb}\n\n${feats}`;
    }).join("\n\n");
    return `# Pricing — ${SITE_NAME}\n\n${plans}\n\n[Start free](${abs("/sign-up")})\n`;
  }

  if (pathname === "/faq") {
    const faqs = FAQS.map((f) => `## ${f.q}\n\n${f.a}`).join("\n\n");
    return `# FAQ — ${SITE_NAME}\n\n${faqs}\n\n[Contact](${abs("/contact")}) · [Pricing](${abs("/pricing")})\n`;
  }

  if (pathname === "/about") {
    return `# About — ${SITE_NAME}\n\n${SITE_DESCRIPTION}\n\nWe help founders and creators post consistently without sounding like generic AI.\n\n[Contact](${abs("/contact")})\n`;
  }

  if (pathname === "/contact") {
    return `# Contact — ${SITE_NAME}\n\nReach us at [the contact form](${abs("/contact")}) for support, partnerships, or agency inquiries.\n`;
  }

  if (pathname === "/privacy") {
    return `# Privacy Policy — ${SITE_NAME}\n\nSee the full policy at ${abs("/privacy")}.\n`;
  }

  if (pathname === "/terms") {
    return `# Terms & Conditions — ${SITE_NAME}\n\nSee the full terms at ${abs("/terms")}.\n`;
  }

  if (pathname === "/guides") {
    const guides = getPublishedGuides()
      .map((g) => `- [${g.title}](${abs(`/guides/${g.slug}`)}): ${g.description}`)
      .join("\n");
    return `# Guides — ${SITE_NAME}\n\n${guides}\n`;
  }

  if (pathname.startsWith("/guides/")) {
    const slug = pathname.slice("/guides/".length);
    const guide = getGuideBySlug(slug);
    if (!guide) return null;
    const sections = guide.sections
      .map((s) => `## ${s.heading}\n\n${s.body}`)
      .join("\n\n");
    return `# ${guide.title}\n\n> ${guide.answerCapsule}\n\n${guide.description}\n\n${sections}\n`;
  }

  return null;
}
