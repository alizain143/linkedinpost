import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  CASE_STUDIES,
  getCaseStudyBySlug,
} from "@/lib/seo/acquisition-pages";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};

  return pageMetadata({
    title: study.seoTitle,
    description: study.description,
    path: `/case-studies/${study.slug}`,
    openGraphImage: `/case-studies/${study.slug}/opengraph-image`,
    openGraphImageAlt: study.title,
  });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Case studies", path: "/case-studies" },
          { name: study.title, path: `/case-studies/${study.slug}` },
        ]}
      />

      <article className="mx-auto max-w-[820px] px-7 py-14">
        <nav className="mb-8 text-sm font-medium text-[#64748b]">
          <Link href="/case-studies" className="hover:text-[#4338ca]">
            Case studies
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#334155]">{study.title}</span>
        </nav>

        <p className="text-xs font-bold uppercase tracking-[0.06em] text-[#6366f1]">
          {study.role} · {study.timeframe}
        </p>
        <h1 className="mt-3 font-display text-[clamp(32px,4.6vw,44px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
          {study.title}
        </h1>
        <p className="mt-6 border-l-4 border-[#6366f1] pl-5 text-[17px] leading-relaxed text-[#475569]">
          {study.summary}
        </p>

        <section className="mt-10 rounded-[18px] border border-[#eceef4] bg-white p-7">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0d1326]">
            Situation
          </h2>
          <p className="mt-3 text-[15.5px] leading-[1.7] text-[#475569]">
            {study.situation}
          </p>
        </section>

        <section className="mt-5 rounded-[18px] border border-[#eceef4] bg-white p-7">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0d1326]">
            Approach
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {study.approach.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] leading-[1.6] text-[#475569]"
              >
                <MsIcon
                  name="arrow_right"
                  size={20}
                  className="mt-0.5 shrink-0 text-[#4f46e5]"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5 rounded-[18px] border border-[#eceef4] bg-[#fbfbfd] p-7">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0d1326]">
            Results
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {study.results.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] leading-[1.6] text-[#475569]"
              >
                <MsIcon
                  name="check_circle"
                  size={20}
                  className="mt-0.5 shrink-0 text-[#4f46e5]"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-6 rounded-[14px] border border-[#eceef4] bg-white px-5 py-4 text-[13.5px] leading-[1.55] text-[#64748b]">
          {study.note}
        </p>

        <p className="mt-8 text-center text-[14.5px] text-[#64748b]">
          Related:{" "}
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
          ,{" "}
          <Link
            href="/guides"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            guides
          </Link>
          .
        </p>

        <div className="mt-10 text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
          >
            Try a similar setup <MsIcon name="arrow_forward" size={19} />
          </Link>
        </div>
      </article>
    </MarketingLayout>
  );
}
