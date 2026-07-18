import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLd,
} from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { FAQS } from "@/lib/marketing-data";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about linkedinpost.ai — AI LinkedIn posts, credits, plans, scheduling, and agency workspaces.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <MarketingLayout>
      <FaqPageJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]}
      />
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[820px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            FAQ
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            Questions, answered.
          </h1>
          <p className="mx-auto mt-[22px] max-w-[600px] text-lg leading-[1.6] text-[#5a667a]">
            Everything you need to know about credits, voice, plans, and how
            linkedinpost.ai helps you post without sounding like generic AI.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-14">
        <div className="flex flex-col gap-3.5">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="rounded-[14px] border border-[#eceef4] bg-white px-6 py-[22px]"
            >
              <div className="mb-2 flex items-start gap-3">
                <MsIcon name="help" size={20} className="shrink-0 text-[#4f46e5]" />
                <h2 className="font-display text-[16.5px] font-bold tracking-[-0.01em]">
                  {f.q}
                </h2>
              </div>
              <p className="ml-8 text-[14.5px] leading-[1.62] text-[#64748b]">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-7 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#6d3fe0] to-[#0891b2] px-10 py-14 text-center shadow-[0_30px_70px_-30px_rgba(79,70,229,0.6)]">
          <div className="relative">
            <h2 className="font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.025em] text-white">
              Still have a question?
            </h2>
            <p className="mx-auto mt-3.5 max-w-[480px] text-[16px] leading-[1.55] text-white/[0.86]">
              See plans, or message us — we usually reply within one business day.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-bold text-[#4338ca] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5"
              >
                View pricing
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/18"
              >
                Contact us <MsIcon name="arrow_forward" size={18} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-transparent px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
