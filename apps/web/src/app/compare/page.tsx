import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { COMPARISON_PAGES } from "@/lib/seo/acquisition-pages";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Compare LinkedIn Tools",
  description:
    "See how linkedinpost.ai compares to Taplio, Buffer, and AuthoredUp for LinkedIn writing, review, and calendars.",
  path: "/compare",
  openGraphImage: "/compare/opengraph-image",
  openGraphImageAlt: "Compare linkedinpost.ai with other LinkedIn tools",
});

export default function CompareHubPage() {
  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Compare", path: "/compare" },
        ]}
      />
      <ItemListJsonLd
        name="linkedinpost.ai comparisons"
        description="Side-by-side comparisons of linkedinpost.ai and other LinkedIn tools."
        items={COMPARISON_PAGES.map((page) => ({
          name: page.title,
          path: `/compare/${page.slug}`,
          description: page.description,
        }))}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Compare
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            Pick the right tool for the job.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            Honest comparisons for LinkedIn writing, review, and calendars. We
            say when another product fits better.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-12">
        <div className="flex flex-col gap-4">
          {COMPARISON_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/compare/${page.slug}`}
              className="block rounded-[18px] border border-[#eceef4] bg-white p-6 shadow-[0_1px_2px_rgba(24,28,64,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0f172a]">
                    {page.title}
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
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-16 text-center">
        <p className="mb-6 text-[15px] text-[#64748b]">
          Prefer to skip the matrix? See{" "}
          <Link
            href="/features"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            features
          </Link>
          ,{" "}
          <Link
            href="/pricing"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            pricing
          </Link>
          , or{" "}
          <Link
            href="/guides"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            guides
          </Link>
          .
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
        >
          Try linkedinpost.ai free <MsIcon name="arrow_forward" size={19} />
        </Link>
      </section>
    </MarketingLayout>
  );
}
