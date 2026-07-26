import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLdFromItems,
} from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  COMPARISON_PAGES,
  getComparisonBySlug,
} from "@/lib/seo/acquisition-pages";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return COMPARISON_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);
  if (!page) return {};

  return pageMetadata({
    title: page.seoTitle,
    description: page.description,
    path: `/compare/${page.slug}`,
    openGraphImage: `/compare/${page.slug}/opengraph-image`,
    openGraphImageAlt: page.title,
  });
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);
  if (!page) notFound();

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Compare", path: "/compare" },
          { name: page.competitorName, path: `/compare/${page.slug}` },
        ]}
      />
      <FaqPageJsonLdFromItems items={page.faqs} />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Compare
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            {page.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] border-l-4 border-[#6366f1] pl-5 text-left text-lg leading-[1.55] text-[#5a667a]">
            {page.answerCapsule}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[960px] px-7 py-12">
        <h2 className="mb-5 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          Side-by-side differences
        </h2>
        <div className="overflow-x-auto rounded-[18px] border border-[#eceef4] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14.5px]">
            <thead>
              <tr className="border-b border-[#eceef4] bg-[#f8f9fc]">
                <th className="px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.04em] text-[#64748b]">
                  Area
                </th>
                <th className="px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.04em] text-[#4f46e5]">
                  linkedinpost.ai
                </th>
                <th className="px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.04em] text-[#64748b]">
                  {page.competitorName}
                </th>
              </tr>
            </thead>
            <tbody>
              {page.differences.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[#f1f3f8] last:border-b-0"
                >
                  <td className="px-5 py-4 align-top font-semibold text-[#0d1326]">
                    {row.label}
                  </td>
                  <td className="px-5 py-4 align-top leading-[1.55] text-[#475569]">
                    {row.us}
                  </td>
                  <td className="px-5 py-4 align-top leading-[1.55] text-[#64748b]">
                    {row.them}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-12">
        <h2 className="mb-5 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          Who wins when
        </h2>
        <div className="flex flex-col gap-3.5">
          {page.whoWinsWhen.map((item) => (
            <div
              key={item.when}
              className="rounded-[16px] border border-[#eceef4] bg-white p-6"
            >
              <p className="text-[15px] leading-[1.55] text-[#5a667a]">
                {item.when}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-display text-[16px] font-bold text-[#0d1326]">
                <MsIcon name="check_circle" size={20} className="text-[#4f46e5]" />
                Pick {item.pick}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-12">
        <h2 className="mb-5 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          Common questions
        </h2>
        <div className="flex flex-col gap-3.5">
          {page.faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-[14px] border border-[#eceef4] bg-white px-6 py-[22px]"
            >
              <div className="mb-2 flex items-start gap-3">
                <MsIcon
                  name="help"
                  size={20}
                  className="shrink-0 text-[#4f46e5]"
                />
                <h3 className="font-display text-[16.5px] font-bold tracking-[-0.01em]">
                  {faq.q}
                </h3>
              </div>
              <p className="ml-8 text-[14.5px] leading-[1.62] text-[#64748b]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[14.5px] text-[#64748b]">
          See all{" "}
          <Link
            href="/compare"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            comparisons
          </Link>
          ,{" "}
          <Link
            href="/features"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            features
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
      </section>

      <section className="mx-auto max-w-[1180px] px-7 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#6d3fe0] to-[#0891b2] px-10 py-14 text-center shadow-[0_30px_70px_-30px_rgba(79,70,229,0.6)]">
          <div className="relative">
            <h2 className="font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.025em] text-white">
              Ready to try the voice-first path?
            </h2>
            <p className="mx-auto mt-3.5 max-w-[480px] text-[16px] leading-[1.55] text-white/[0.86]">
              Set up a profile, generate reviewed drafts, and keep approval in
              your hands.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-bold text-[#4338ca] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5"
              >
                Start free <MsIcon name="arrow_forward" size={18} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/18"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
