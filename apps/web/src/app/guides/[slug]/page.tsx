import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { GuideByline } from "@/components/seo/guide-byline";
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FaqPageJsonLdFromItems,
} from "@/components/seo/json-ld";
import { getGuideBySlug, getPublishedGuides } from "@/lib/guides/content";
import { pageMetadata } from "@/lib/seo/metadata";

function slugifyHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getPublishedGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return pageMetadata({
    title: guide.seoTitle ?? guide.title,
    description: guide.seoDescription ?? guide.description,
    path: `/guides/${guide.slug}`,
    openGraphImage: `/guides/${guide.slug}/opengraph-image`,
    openGraphImageAlt: guide.title,
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedGuides = guide.relatedGuides
    .map((relatedSlug) => getGuideBySlug(relatedSlug))
    .filter((related) => related !== undefined);

  return (
    <MarketingLayout>
      <ArticleJsonLd
        title={guide.title}
        description={guide.description}
        path={`/guides/${guide.slug}`}
        publishedAt={guide.publishedAt}
        updatedAt={guide.updatedAt}
        authorId={guide.authorId}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />
      {guide.faqs && guide.faqs.length > 0 ? (
        <FaqPageJsonLdFromItems items={guide.faqs} />
      ) : null}

      <article className="mx-auto max-w-[820px] px-7 py-14">
        <nav className="mb-8 text-sm font-medium text-[#64748b]">
          <Link href="/guides" className="hover:text-[#4338ca]">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#334155]">{guide.title}</span>
        </nav>

        <h1 className="font-display text-[clamp(32px,4.6vw,44px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
          {guide.title}
        </h1>

        <GuideByline
          authorId={guide.authorId}
          publishedAt={guide.publishedAt}
          updatedAt={guide.updatedAt}
        />

        <p className="mt-8 border-l-4 border-[#6366f1] pl-5 text-[17px] leading-relaxed text-[#475569]">
          {guide.answerCapsule}
        </p>

        <div className="mt-10 flex flex-col gap-8">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2
                id={slugifyHeading(section.heading)}
                className="scroll-mt-24 font-display text-[24px] font-extrabold tracking-tight text-[#0f172a]"
              >
                {section.heading}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.body.split("\n\n").map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 48)}
                    className="text-[15px] leading-[1.7] text-[#475569]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {guide.faqs && guide.faqs.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight">
              Frequently asked questions
            </h2>
            <div className="mt-4 flex flex-col gap-5">
              {guide.faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-[14px] border border-[#eceef4] bg-white px-[22px] py-5"
                >
                  <h3 className="font-display text-[15.5px] font-bold">
                    {faq.q}
                  </h3>
                  <p className="mt-1.5 text-sm leading-[1.6] text-[#64748b]">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {relatedGuides.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight">
              Related guides
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={`/guides/${related.slug}`}
                  className="block rounded-[14px] border border-[#eceef4] bg-white px-5 py-4 transition-colors hover:border-[#c7d2fe]"
                >
                  <h3 className="font-display text-[17px] font-bold">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {related.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-[16px] border border-[#eceef4] bg-[#f8f9fc] p-6">
          <h2 className="font-display text-[18px] font-extrabold tracking-tight text-[#0d1326]">
            Keep going
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-[14.5px] leading-[1.55] text-[#475569]">
            <li>
              See product{" "}
              <Link
                href="/features"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                features
              </Link>{" "}
              for voice profiles, AI Council, and calendars.
            </li>
            <li>
              Comparing tools? Start with{" "}
              <Link
                href="/compare/taplio"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                vs Taplio
              </Link>
              ,{" "}
              <Link
                href="/alternatives"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                alternatives
              </Link>
              , or the{" "}
              <Link
                href="/tools"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                free LinkedIn tools
              </Link>
              .
            </li>
            <li>
              Prefer a founder framing? Read{" "}
              <Link
                href="/for-founders"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                LinkedIn content for founders
              </Link>
              .
            </li>
          </ul>
        </section>

        <div className="mt-12 rounded-[18px] bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] p-8 text-white">
          <h3 className="font-display text-[22px] font-extrabold tracking-tight">
            Want drafts that still sound like you?
          </h3>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/75">
            linkedinpost.ai builds from your voice profile and gives you a month
            of drafts to edit, not a pile of generic posts to copy-paste.
          </p>
          <Link
            href="/sign-up"
            className="mt-6 inline-flex rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-[#4338ca] transition-opacity hover:opacity-90"
          >
            Start free, 15 credits / month
          </Link>
        </div>
      </article>
    </MarketingLayout>
  );
}
