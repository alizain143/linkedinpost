import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { ALTERNATIVE_PAGES } from "@/lib/seo/alternatives";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "LinkedIn Tool Alternatives: Taplio, Buffer, AuthoredUp",
  description:
    "Honest alternatives to Taplio, Buffer, and AuthoredUp for LinkedIn writing, review, and calendars. When to switch and when to stay.",
  path: "/alternatives",
  openGraphImage: "/alternatives/opengraph-image",
  openGraphImageAlt: "LinkedIn tool alternatives from linkedinpost.ai",
});

export default function AlternativesHubPage() {
  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Alternatives", path: "/alternatives" },
        ]}
      />
      <ItemListJsonLd
        name="LinkedIn tool alternatives"
        description="Alternatives to popular LinkedIn content tools."
        items={ALTERNATIVE_PAGES.map((page) => ({
          name: page.title,
          path: `/alternatives/${page.slug}`,
          description: page.description,
        }))}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Alternatives
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            Looking for an alternative? Start with the bottleneck.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            When linkedinpost.ai is a better fit than Taplio, Buffer, or
            AuthoredUp, and when you should stay put.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-12">
        <div className="flex flex-col gap-4">
          {ALTERNATIVE_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/alternatives/${page.slug}`}
              className="block rounded-[18px] border border-[#eceef4] bg-white p-6 shadow-[0_1px_2px_rgba(24,28,64,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0f172a]">
                    {page.h1}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
                    {page.description}
                  </p>
                </div>
                <MsIcon
                  name="arrow_forward"
                  size={22}
                  className="mt-1 shrink-0 text-[#4f46e5]"
                />
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-[14.5px] text-[#64748b]">
          Prefer a side-by-side matrix? See{" "}
          <Link
            href="/compare"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            comparisons
          </Link>
          .
        </p>
      </section>
    </MarketingLayout>
  );
}
