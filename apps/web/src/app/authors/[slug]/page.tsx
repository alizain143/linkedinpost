import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  AuthorProfileJsonLd,
  BreadcrumbJsonLd,
} from "@/components/seo/json-ld";
import {
  getAllAuthors,
  getAuthorBySlug,
  type AuthorId,
} from "@/lib/authors";
import { getPublishedGuides } from "@/lib/guides/content";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllAuthors().map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return {};

  return pageMetadata({
    title: `${author.name}: Guides and Editorial`,
    description: author.description,
    path: `/authors/${author.slug}`,
  });
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const guides = getPublishedGuides().filter(
    (guide) => guide.authorId === (author.id as AuthorId),
  );

  return (
    <MarketingLayout>
      <AuthorProfileJsonLd authorId={author.id} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: author.name, path: `/authors/${author.slug}` },
        ]}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[720px] px-7 pb-[52px] pt-[66px]">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Authors
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] font-display text-lg font-bold text-[#4338ca]"
              role="img"
              aria-label={`${author.name} mark`}
            >
              LP
            </div>
            <div>
              <h1 className="font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326] sm:text-[42px]">
                {author.name}
              </h1>
              <p className="mt-2 text-lg font-medium text-[#475569]">
                {author.jobTitle} · linkedinpost.ai
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            {author.bio.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="text-[17px] leading-relaxed text-[#5a667a]"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {author.sameAs.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[10px] border border-[#eceef4] bg-white px-4 py-2 text-sm font-semibold text-[#4338ca] transition-colors hover:border-[#c7d2fe]"
              >
                {url.includes("linkedin.com")
                  ? "LinkedIn"
                  : url.includes("x.com")
                    ? "X"
                    : "Profile"}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-7 py-12">
        <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0f172a]">
          Guides from this team
        </h2>
        <ul className="mt-5 flex flex-col gap-3">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="block rounded-[14px] border border-[#eceef4] bg-white px-5 py-4 transition-colors hover:border-[#c7d2fe]"
              >
                <span className="font-display text-[17px] font-bold text-[#0f172a]">
                  {guide.title}
                </span>
                <p className="mt-1 text-sm text-[#64748b]">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingLayout>
  );
}
