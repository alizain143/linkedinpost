import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { FeatureDetailMock } from "@/components/sections/marketing/feature-detail-mocks";
import { MsIcon } from "@/components/ui/ms-icon";
import { FEATURE_DETAIL } from "@/lib/marketing-data";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Features — linkedinpost.ai",
  description:
    "Everything you need to post on LinkedIn consistently. AI post generator, content calendar, voice presets, and agency workspaces.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Features
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            Everything you need to post on LinkedIn — consistently.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            From your first hook to a fully scheduled month, linkedinpost.ai
            replaces the blank page with a repeatable system that keeps your voice
            intact.
          </p>
          <Link
            href="/sign-up"
            className="mt-7 inline-flex items-center gap-2 rounded-[11px] bg-[#4f46e5] px-6 py-[13px] text-[15.5px] font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
          >
            Start free <MsIcon name="arrow_forward" size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1100px] flex-col gap-[34px] px-7 py-[30px] pb-5">
        {FEATURE_DETAIL.map((f, i) => {
          const imageFirst = i % 2 === 1;
          return (
            <div
              key={f.title}
              className="grid grid-cols-1 items-center gap-11 rounded-[22px] border border-[#eceef4] bg-white p-[38px] lg:grid-cols-2"
            >
              <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-bold tracking-[0.03em]"
                  style={{ background: f.tint, color: f.color }}
                >
                  <MsIcon name={f.icon} size={15} style={{ color: f.color }} />
                  {f.kicker}
                </div>
                <h2 className="mb-3 font-display text-[27px] font-extrabold leading-[1.18] tracking-[-0.02em] text-[#0d1326]">
                  {f.title}
                </h2>
                <p className="mb-[18px] text-[15px] leading-[1.62] text-[#5a667a]">
                  {f.body}
                </p>
                <div className="flex flex-col gap-2.5">
                  {f.bullets.map((b) => (
                    <div
                      key={b}
                      className="flex items-start gap-[9px] text-[14.5px] text-[#1e293b]"
                    >
                      <MsIcon
                        name="check_circle"
                        size={19}
                        className="shrink-0"
                        style={{ color: f.color }}
                      />
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
                <div
                  className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-[#e7e9f2] p-5"
                  style={{ background: f.tint }}
                >
                  <FeatureDetailMock index={i} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-[1100px] px-7 pb-16 pt-[30px]">
        <div className="rounded-[22px] bg-gradient-to-br from-[#4f46e5] from-0% via-[#6d3fe0] via-50% to-[#0891b2] to-100% px-12 py-12 text-center">
          <h2 className="mb-2.5 font-display text-[30px] font-extrabold tracking-[-0.02em] text-white">
            See it on your own voice.
          </h2>
          <p className="mb-6 text-base text-white/85">
            Generate your first five posts free — no credit card.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-[26px] py-[13px] text-[15.5px] font-bold text-[#4338ca] transition-transform hover:-translate-y-0.5"
          >
            Start Free
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
