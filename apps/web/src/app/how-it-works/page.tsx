import type { Metadata } from "next";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { STEPS } from "@/lib/marketing-data";
import { pageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "How It Works — linkedinpost.ai",
  description:
    "From blank page to a publishing system in four steps. Set up once, then generate and plan in minutes a week.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "How it works", path: "/how-it-works" },
        ]}
      />
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            How it works
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            From blank page to a publishing system in four steps.
          </h1>
          <p className="mx-auto mt-5 max-w-[580px] text-lg leading-[1.55] text-[#5a667a]">
            No prompt engineering, no guesswork. Set up once, then generate and
            plan in minutes a week.
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-[880px] flex-col gap-[18px] px-7 py-12">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="flex items-start gap-6 rounded-[18px] border border-[#eceef4] bg-white p-7"
          >
            <div className="flex shrink-0 flex-col items-center gap-2.5">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] shadow-[0_8px_18px_-8px_rgba(79,70,229,0.5)]">
                <MsIcon name={s.icon} size={27} className="text-white" />
              </div>
              <span className="font-display text-[13px] font-extrabold text-[#cbd2e0]">
                {s.num}
              </span>
            </div>
            <div className="pt-1">
              <h2 className="font-display text-[21px] font-bold tracking-[-0.01em] text-[#0d1326]">
                {s.title}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.62] text-[#5a667a]">
                {s.body}
              </p>
            </div>
          </div>
        ))}
        <div className="mt-[18px] text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
          >
            Try it free <MsIcon name="arrow_forward" size={19} />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
