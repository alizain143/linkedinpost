import type { Metadata } from "next";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { VALUES } from "@/lib/marketing-data";
import { pageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "About | linkedinpost.ai",
  description:
    "We're fixing the blank page for a million professionals. linkedinpost.ai helps founders and creators post consistently without sounding like generic AI.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[820px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Our story
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            We&apos;re fixing the blank page for a million professionals.
          </h1>
          <p className="mx-auto mt-[22px] max-w-[640px] text-lg leading-[1.6] text-[#5a667a]">
            linkedinpost.ai started with a simple frustration: the people with the
            most valuable things to say post the least, because writing
            consistently is hard, and generic AI makes it worse. We built the tool
            we wished existed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-7 py-[46px]">
        <div className="rounded-[20px] border border-[#eceef4] bg-white p-10">
          <h2 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
            Why we exist
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.7] text-[#475569]">
            Your reputation compounds when you show up. But most professionals get
            stuck between two bad options: post nothing, or post bland AI filler
            that quietly erodes trust. Neither builds a brand.
          </p>
          <p className="mt-3.5 text-[15.5px] leading-[1.7] text-[#475569]">
            We believe the answer isn&apos;t more automation. It&apos;s better
            leverage. Capture your voice once, and let software handle the
            structure, the planning, and the blank-page friction. You stay the
            author; we handle the system.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-7 pb-16 pt-9">
        <h2 className="mb-7 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          What we value
        </h2>
        <div className="pp-grid3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-[#eceef4] bg-white p-[26px]"
            >
              <div className="mb-[15px] flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff]">
                <MsIcon name={v.icon} size={23} className="text-[#4f46e5]" />
              </div>
              <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[#0d1326]">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.6] text-[#64748b]">
                {v.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-9 text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
          >
            Join us, start free <MsIcon name="arrow_forward" size={19} />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
