import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getPublishedGuides } from "@/lib/guides/content";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "LinkedIn Content Guides — linkedinpost.ai",
  description:
    "Practical guides on LinkedIn posting frequency, content calendars, hooks, and writing posts that don't sound like AI.",
  path: "/guides",
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
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Guides
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            LinkedIn content, explained clearly.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            Practical playbooks on posting frequency, calendars, hooks, and
            keeping AI drafts authentic — so you publish with confidence.
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
      </section>
    </MarketingLayout>
  );
}
