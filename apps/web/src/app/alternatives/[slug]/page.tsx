import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLdFromItems,
} from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { getGuideBySlug } from "@/lib/guides/content";
import {
  ALTERNATIVE_PAGES,
  getAlternativeBySlug,
} from "@/lib/seo/alternatives";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return ALTERNATIVE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getAlternativeBySlug(slug);
  if (!page) return {};

  return pageMetadata({
    title: page.seoTitle,
    description: page.description,
    path: `/alternatives/${page.slug}`,
    openGraphImage: `/alternatives/${page.slug}/opengraph-image`,
    openGraphImageAlt: page.h1,
  });
}

function ProseBlocks({ body }: { body: string }) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {body.split("\n\n").map((paragraph) => (
        <p
          key={paragraph.slice(0, 64)}
          className="text-[15px] leading-[1.7] text-[#475569]"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params;
  const page = getAlternativeBySlug(slug);
  if (!page) notFound();

  const relatedGuides = page.relatedGuideSlugs
    .map((guideSlug) => getGuideBySlug(guideSlug))
    .filter((guide) => guide !== undefined);

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Alternatives", path: "/alternatives" },
          { name: page.competitorName, path: `/alternatives/${page.slug}` },
        ]}
      />
      <FaqPageJsonLdFromItems items={page.faqs} />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px]">
          <div className="mb-3.5 text-center text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Alternative
          </div>
          <h1 className="pp-hero-h1 text-center font-display text-[40px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326] sm:text-[48px]">
            {page.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-[680px] border-l-4 border-[#6366f1] pl-5 text-[17px] leading-[1.55] text-[#5a667a]">
            {page.answerCapsule}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-12">
        <h2 className="mb-5 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          Why people look for a {page.competitorName} alternative
        </h2>
        <div className="flex flex-col gap-4">
          {page.whyLook.map((item) => (
            <div
              key={item.heading}
              className="rounded-[16px] border border-[#eceef4] bg-white p-6"
            >
              <h3 className="font-display text-[18px] font-bold text-[#0d1326]">
                {item.heading}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.65] text-[#475569]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-12">
        <h2 className="mb-5 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          What you get with linkedinpost.ai
        </h2>
        <ul className="flex flex-col gap-3">
          {page.whatYouGet.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-[14px] border border-[#eceef4] bg-white px-4 py-3.5 text-[14.5px] leading-[1.55] text-[#475569]"
            >
              <MsIcon
                name="check_circle"
                size={20}
                className="mt-0.5 shrink-0 text-[#4f46e5]"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-[22px] font-extrabold tracking-tight text-[#0d1326]">
              Stay on {page.competitorName} if...
            </h2>
            <ul className="flex flex-col gap-3">
              {page.whenStay.map((item) => (
                <li
                  key={item}
                  className="rounded-[14px] border border-[#eceef4] bg-white px-4 py-3.5 text-[14.5px] leading-[1.55] text-[#475569]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 font-display text-[22px] font-extrabold tracking-tight text-[#0d1326]">
              Switch if...
            </h2>
            <ul className="flex flex-col gap-3">
              {page.whenSwitch.map((item) => (
                <li
                  key={item}
                  className="rounded-[14px] border border-[#c7d2fe] bg-[#f8f9ff] px-4 py-3.5 text-[14.5px] leading-[1.55] text-[#475569]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[820px] px-7 pb-12">
        <div className="flex flex-col gap-10">
          {page.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-[24px] font-extrabold tracking-tight text-[#0f172a]">
                {section.heading}
              </h2>
              <ProseBlocks body={section.body} />
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
              <h3 className="font-display text-[16.5px] font-bold">{faq.q}</h3>
              <p className="mt-2 text-[14.5px] leading-[1.62] text-[#64748b]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {relatedGuides.length > 0 ? (
        <section className="mx-auto max-w-[880px] px-7 pb-12">
          <h2 className="mb-5 text-center font-display text-[26px] font-extrabold">
            Related guides
          </h2>
          <div className="flex flex-col gap-3">
            {relatedGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="block rounded-[14px] border border-[#eceef4] bg-white px-5 py-4 hover:border-[#c7d2fe]"
              >
                <h3 className="font-display text-[17px] font-bold">
                  {guide.title}
                </h3>
                <p className="mt-1 text-sm text-[#64748b]">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[880px] px-7 pb-16 text-center text-[14.5px] text-[#64748b]">
        Want the full matrix? Read{" "}
        <Link
          href={page.comparePath}
          className="font-semibold text-[#4f46e5] hover:underline"
        >
          linkedinpost.ai vs {page.competitorName}
        </Link>
        . Or try our{" "}
        <Link
          href="/tools"
          className="font-semibold text-[#4f46e5] hover:underline"
        >
          free LinkedIn tools
        </Link>
        .
      </section>

      <section className="mx-auto max-w-[1180px] px-7 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#6d3fe0] to-[#0891b2] px-10 py-14 text-center">
          <h2 className="font-display text-[32px] font-extrabold text-white">
            Try the alternative free
          </h2>
          <p className="mx-auto mt-3.5 max-w-[480px] text-[16px] text-white/85">
            Build a voice profile, generate reviewed drafts, and approve before
            anything publishes.
          </p>
          <Link
            href="/sign-up"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-bold text-[#4338ca]"
          >
            Start free <MsIcon name="arrow_forward" size={18} />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
