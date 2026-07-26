import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { CASE_STUDIES } from "@/lib/seo/acquisition-pages";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Case Studies",
  description:
    "Illustrative LinkedIn content workflows for founders and agencies using voice profiles, review, and calendars.",
  path: "/case-studies",
  openGraphImage: "/case-studies/opengraph-image",
  openGraphImageAlt: "linkedinpost.ai case studies",
});

export default function CaseStudiesHubPage() {
  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Case studies", path: "/case-studies" },
        ]}
      />
      <ItemListJsonLd
        name="linkedinpost.ai case studies"
        description="Illustrative workflows for founders and agencies."
        items={CASE_STUDIES.map((study) => ({
          name: study.title,
          path: `/case-studies/${study.slug}`,
          description: study.description,
        }))}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Case studies
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            How the system shows up in real weeks.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            Composite walkthroughs based on common founder and agency
            workflows. Not named customer endorsements.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-12">
        <div className="flex flex-col gap-4">
          {CASE_STUDIES.map((study) => (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              className="block rounded-[18px] border border-[#eceef4] bg-white p-6 shadow-[0_1px_2px_rgba(24,28,64,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6366f1]">
                {study.role} · {study.timeframe}
              </p>
              <h2 className="mt-2 font-display text-[22px] font-extrabold tracking-tight text-[#0f172a]">
                {study.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
                {study.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4f46e5]">
                Read walkthrough <MsIcon name="arrow_forward" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-16 text-center">
        <p className="mb-6 text-[15px] text-[#64748b]">
          Building something similar? See{" "}
          <Link
            href="/for-founders"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            for founders
          </Link>
          ,{" "}
          <Link
            href="/for-agencies"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            for agencies
          </Link>
          , or{" "}
          <Link
            href="/pricing"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            pricing
          </Link>
          .
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
        >
          Try it free <MsIcon name="arrow_forward" size={19} />
        </Link>
      </section>
    </MarketingLayout>
  );
}
