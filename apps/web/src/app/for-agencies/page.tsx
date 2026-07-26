import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLdFromItems,
} from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { getPersonaBySlug } from "@/lib/seo/acquisition-pages";
import { pageMetadata } from "@/lib/seo/metadata";

const persona = getPersonaBySlug("agencies");

export const metadata: Metadata = persona
  ? pageMetadata({
      title: persona.seoTitle,
      description: persona.description,
      path: "/for-agencies",
      openGraphImage: "/for-agencies/opengraph-image",
      openGraphImageAlt: persona.title,
    })
  : {};

export default function ForAgenciesPage() {
  const page = getPersonaBySlug("agencies");
  if (!page) notFound();

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "For agencies", path: "/for-agencies" },
        ]}
      />
      <FaqPageJsonLdFromItems items={page.faqs} />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            For agencies
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            {page.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-lg leading-[1.55] text-[#5a667a]">
            {page.answerCapsule}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[960px] px-7 py-12">
        <h2 className="mb-6 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          What usually breaks at scale
        </h2>
        <div className="pp-grid3">
          {page.pains.map((pain) => (
            <div
              key={pain.title}
              className="rounded-2xl border border-[#eceef4] bg-white p-[26px]"
            >
              <div className="mb-[15px] flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff]">
                <MsIcon name="groups" size={23} className="text-[#4f46e5]" />
              </div>
              <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[#0d1326]">
                {pain.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.6] text-[#64748b]">
                {pain.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-12">
        <div className="rounded-[18px] border border-[#eceef4] bg-[#fbfbfd] p-8">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0d1326]">
            What Agency is built for
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {page.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex items-start gap-3 text-[15px] leading-[1.55] text-[#475569]"
              >
                <MsIcon
                  name="check_circle"
                  size={20}
                  className="mt-0.5 shrink-0 text-[#4f46e5]"
                />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto flex max-w-[880px] flex-col gap-[18px] px-7 pb-12">
        <h2 className="text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          How agencies run the week
        </h2>
        {page.steps.map((step, index) => (
          <div
            key={step.title}
            className="flex items-start gap-6 rounded-[18px] border border-[#eceef4] bg-white p-7"
          >
            <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] shadow-[0_8px_18px_-8px_rgba(79,70,229,0.5)]">
              <span className="font-display text-[18px] font-extrabold text-white">
                {index + 1}
              </span>
            </div>
            <div className="pt-1">
              <h3 className="font-display text-[21px] font-bold tracking-[-0.01em] text-[#0d1326]">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.62] text-[#5a667a]">
                {step.body}
              </p>
            </div>
          </div>
        ))}
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
          Compare{" "}
          <Link
            href="/pricing"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            Agency pricing
          </Link>
          , browse{" "}
          <Link
            href="/features"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            features
          </Link>
          , or{" "}
          <Link
            href="/contact"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            contact us
          </Link>{" "}
          about larger rosters.
        </p>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-16 text-center">
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
        >
          Start free for your agency <MsIcon name="arrow_forward" size={19} />
        </Link>
      </section>
    </MarketingLayout>
  );
}
