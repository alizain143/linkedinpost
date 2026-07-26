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
  title: "LinkedIn Content Guides",
  description:
    "Clear LinkedIn advice for founders: posting cadence, calendars, hooks, algorithm basics, and keeping AI drafts from sounding generic.",
  path: "/guides",
  openGraphImage: "/guides/opengraph-image",
  openGraphImageAlt: "LinkedIn content guides",
});

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
            Guides
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            LinkedIn content advice, said clearly.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            How often to post, how to plan a month, what hooks earn the click,
            and how to keep AI drafts from sounding like everyone else.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-12">
        <div className="flex flex-col gap-4">
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
            drafts you can actually publish.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-[#4338ca] transition-opacity hover:opacity-90"
            >
              Start free <MsIcon name="arrow_forward" size={18} />
            </Link>
            <Link
              href="/for-founders"
              className="inline-flex rounded-[10px] border border-white/35 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              For founders
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
