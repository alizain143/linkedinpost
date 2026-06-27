import type { Metadata } from "next";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PRIVACY_SECTIONS } from "@/lib/marketing-data";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy — linkedinpost.ai",
  description:
    "Privacy policy for linkedinpost.ai — what we collect, how we use it, and your choices.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-[#eef0f5] bg-[#fbfbfd]">
        <div className="mx-auto max-w-[820px] px-7 pb-10 pt-14">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Legal
          </div>
          <h1 className="font-display text-[38px] font-extrabold tracking-[-0.025em] text-[#0d1326]">
            Privacy Policy
          </h1>
          <p className="mt-2.5 text-sm text-[#94a3b8]">Last updated June 1, 2026</p>
        </div>
      </section>
      <section className="mx-auto max-w-[820px] px-7 pb-16 pt-11">
        <p className="mb-[30px] text-[15.5px] leading-[1.7] text-[#475569]">
          This policy explains what we collect, how we use it, and the choices you
          have. We keep it short and readable on purpose.
        </p>
        <div className="flex flex-col gap-7">
          {PRIVACY_SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-[19px] font-bold tracking-[-0.01em] text-[#0d1326]">
                {s.h}
              </h2>
              {s.p.map((para) => (
                <p
                  key={para.slice(0, 40)}
                  className="mt-2.5 text-[15px] leading-[1.7] text-[#5a667a]"
                >
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
