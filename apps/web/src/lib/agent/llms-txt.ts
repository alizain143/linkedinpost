import { formatUsdPrice } from "@/lib/currency/format";
import { FAQS, PLANS } from "@/lib/marketing-data";
import { getPublishedGuides } from "@/lib/guides/content";
import { MARKETING_PAGES } from "@/lib/seo/pages";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/site";

function url(path: string): string {
  const base = getSiteUrl().origin;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Curated index per https://llmstxt.org/ */
export function buildLlmsTxt(): string {
  const guides = getPublishedGuides();
  const guideLines = guides
    .map((g) => `- [${g.title}](${url(`/guides/${g.slug}`)}): ${g.description}`)
    .join("\n");

  const planSummary = PLANS.filter((p) => p.monthlyUsd > 0)
    .map((p) => `${p.name} (${formatUsdPrice(p.monthlyUsd)}/mo)`)
    .join(", ");

  return `# ${SITE_NAME}

> ${SITE_TAGLINE}

${SITE_DESCRIPTION}

## Product

- [Home](${url("/")}): Product overview and sign-up
- [Features](${url("/features")}): AI Council, content calendar, media generator, autopilot
- [How it works](${url("/how-it-works")}): Voice profile → AI Council → media → publish
- [Pricing](${url("/pricing")}): Free + paid plans (${planSummary})
- [About](${url("/about")}): Mission and team
- [Sign up free](${url("/sign-up")}): 5 AI credits/month, no credit card

## Guides

${guideLines}

## Contact

- [Contact](${url("/contact")})
- [Privacy policy](${url("/privacy")})
- [Terms of service](${url("/terms")})
- [Sitemap](${url("/sitemap.xml")})

## Optional

- [LLM full index](${url("/llms-full.txt")})
- [Agent skills index](${url("/.well-known/agent-skills/index.json")})
`;
}

function faqBlock(title: string, items: { q: string; a: string }[]): string {
  const lines = items.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n");
  return `## ${title}\n\n${lines}`;
}

function pricingBlock(): string {
  const plans = PLANS.map((p) => {
    const features = p.features.map((f) => `- ${f}`).join("\n");
    return `### ${p.name}, ${formatUsdPrice(p.monthlyUsd)}/month

${p.blurb}

${features}`;
  }).join("\n\n");

  return `## Pricing\n\n${plans}`;
}

function guideFullContent(): string {
  return getPublishedGuides()
    .map((guide) => {
      const sections = guide.sections
        .map((s) => `### ${s.heading}\n\n${s.body}`)
        .join("\n\n");
      const faqs = guide.faqs
        ?.map((f) => `**Q:** ${f.q}\n\n**A:** ${f.a}`)
        .join("\n\n");

      return `## ${guide.title}

> ${guide.answerCapsule}

${guide.description}

${sections}
${faqs ? `\n### FAQ\n\n${faqs}` : ""}

*Updated: ${guide.updatedAt}*`;
    })
    .join("\n\n---\n\n");
}

/** Full site content in one file per llms-full.txt convention. */
export function buildLlmsFullTxt(): string {
  const pages = MARKETING_PAGES.map(
    (p) => `- [${p.path === "/" ? "Home" : p.path}](${url(p.path)})`,
  ).join("\n");

  return `# ${SITE_NAME}

> ${SITE_TAGLINE}

${SITE_DESCRIPTION}

## Site pages

${pages}

## Features

- **AI Content Council**: Writer, reviewer, and editor agents improve every post before you see it.
- **30-day content calendar**: Plan a month of LinkedIn posts mapped to your content pillars.
- **Voice & tone presets**: Reusable content profiles that keep your writing recognizable.
- **Media generator**: Images, text cards, and carousels designed for the LinkedIn feed.
- **Autopilot**: Automatically prepares upcoming posts from your strategy.
- **Agency workspaces**: Manage up to 5 client brands from one account.

${pricingBlock()}

${faqBlock("FAQ", [...FAQS])}

## Guides

${guideFullContent()}
`;
}
