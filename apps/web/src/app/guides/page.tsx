import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  ItemListJsonLd,
} from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { getPublishedGuides } from "@/lib/guides/content";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "LinkedIn Content Guides: Hooks, Cadence, Algorithm",
  description:
    "Clear LinkedIn advice for founders: posting cadence, calendars, hooks, algorithm basics, and keeping AI drafts from sounding generic.",
  path: "/guides",
  openGraphImage: "/guides/opengraph-image",
  openGraphImageAlt: "LinkedIn content guides on hooks, cadence, and algorithm",
});

const HUB_INTRO = [
  "This hub is for founders and operators who want LinkedIn to work without becoming a full-time creator. The guides below are practical: how often to post, how to plan a month, which hooks earn the click, what actually matters in the algorithm, and how to keep AI drafts from sounding like everyone else.",
  "Start with the problem you have this week. If drafts feel robotic, read the voice guide first. If you keep falling off cadence, open the posting frequency or calendar template. If you need attention in the first two lines, go straight to hooks. Each article stands alone, and each one links to related pieces so you can build a system instead of collecting random tips.",
  "When you are ready to turn advice into a weekly workflow, linkedinpost.ai helps with voice profiles, reviewed drafts, and a calendar. The free tools (character counter and text formatter) sit next to these guides if you want something you can use in the browser with no signup.",
];

const PILLARS = [
  {
    title: "Voice and authenticity",
    body: "Most AI LinkedIn posts fail for the same reason: they could sit under any founder name and still make sense. The authenticity guides show how to add one detail only you would know, keep a banned phrase list, and run a short human pass before publish. Pair them with a voice profile if you use linkedinpost.ai so you are not re-explaining yourself every draft.",
    href: "/guides/linkedin-posts-dont-sound-like-ai",
  },
  {
    title: "Cadence and calendars",
    body: "Consistency beats heroic bursts. The cadence and calendar guides help you pick a sustainable posting rhythm, leave blank days on purpose, and batch ideas without freezing a month of stale copy. If you manage clients, the agency workflow guide covers separate voices and approvals so brands do not blur together.",
    href: "/guides/linkedin-content-calendar-template",
  },
  {
    title: "Hooks, algorithm, and formats",
    body: "The first lines decide whether anyone expands the post. Hooks, algorithm basics, carousels, and personal branding guides help you earn attention without gimmicks. Use the character counter tool when you care about the see more cutoff, and the text formatter when you need Unicode bold or bullets that survive paste into LinkedIn.",
    href: "/guides/linkedin-hooks-that-get-engagement",
  },
];

function GuideCard({
  title,
  description,
  updatedAt,
  slug,
}: {
  title: string;
  description: string;
  updatedAt: string;
  slug: string;
}) {
  const updated = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/guides/${slug}`}
      className="block rounded-[18px] border border-[#eceef4] bg-white p-6 shadow-[0_1px_2px_rgba(24,28,64,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold text-[#64748b]">Updated {updated}</p>
      <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tight text-[#0f172a]">
        {title}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
        {description}
      </p>
    </Link>
  );
}

export default function GuidesHubPage() {
  const guides = getPublishedGuides();

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ]}
      />
      <ItemListJsonLd
        name="LinkedIn content guides"
        description="Practical LinkedIn guides for founders and agencies."
        items={guides.map((guide) => ({
          name: guide.title,
          path: `/guides/${guide.slug}`,
          description: guide.description,
        }))}
      />
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            LinkedIn Content Hub
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            LinkedIn content advice, said clearly.
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-lg leading-[1.55] text-[#5a667a]">
            How often to post, how to plan a month, what hooks earn the click,
            and how to keep AI drafts from sounding like everyone else.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-7 py-12">
        <div className="flex flex-col gap-4">
          {HUB_INTRO.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-[15px] leading-[1.7] text-[#475569]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <h2 className="mt-12 font-display text-[26px] font-extrabold tracking-tight text-[#0d1326]">
          Three places to start
        </h2>
        <div className="mt-5 flex flex-col gap-4">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[16px] border border-[#eceef4] bg-white p-6"
            >
              <h3 className="font-display text-[18px] font-bold text-[#0d1326]">
                {pillar.title}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.65] text-[#475569]">
                {pillar.body}
              </p>
              <Link
                href={pillar.href}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4f46e5] hover:underline"
              >
                Open guide <MsIcon name="arrow_forward" size={16} />
              </Link>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-display text-[26px] font-extrabold tracking-tight text-[#0d1326]">
          All guides
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#64748b]">
          Each card includes a short description so you can pick by problem, not
          by title alone. Prefer product comparisons? See{" "}
          <Link href="/compare" className="font-semibold text-[#4f46e5] hover:underline">
            compare
          </Link>{" "}
          and{" "}
          <Link
            href="/alternatives"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            alternatives
          </Link>
          , or use the{" "}
          <Link href="/tools" className="font-semibold text-[#4f46e5] hover:underline">
            free tools
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-col gap-4">
          {guides.map((guide) => (
            <GuideCard
              key={guide.slug}
              slug={guide.slug}
              title={guide.title}
              description={guide.description}
              updatedAt={guide.updatedAt}
            />
          ))}
        </div>

        <div className="mt-12 rounded-[18px] bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] p-8 text-white">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight">
            Ready to turn this into a weekly system?
          </h2>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/75">
            Start free on linkedinpost.ai, build your voice profile, and generate
            drafts you can actually publish. Or read{" "}
            <Link href="/for-founders" className="underline underline-offset-2">
              for founders
            </Link>{" "}
            if you want the 30-minute week framing first.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-[#4338ca] transition-opacity hover:opacity-90"
            >
              Start free <MsIcon name="arrow_forward" size={18} />
            </Link>
            <Link
              href="/features"
              className="inline-flex rounded-[10px] border border-white/35 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              See features
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
