import Link from "next/link";
import { HeroDashboardMockup } from "@/components/sections/landing/hero-dashboard-mockup";
import { MsIcon } from "@/components/ui/ms-icon";
import { TRUST_LOGOS } from "@/lib/marketing-data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_100%_at_50%_-20%,#eef0ff_0%,#f6f7f9_46%)]">
      <div className="mx-auto max-w-[1180px] px-7 pb-[30px] pt-[74px] text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-2 py-1.5 pl-2 pr-[13px] text-[13px] font-semibold text-[#4338ca] shadow-[0_2px_8px_rgba(20,20,60,0.05)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[#4f46e5]">
            <MsIcon name="auto_awesome" size={15} />
            New
          </span>
          AI that writes like you, not like a robot
        </div>

        <h1 className="pp-hero-h1 mx-auto max-w-[830px] font-display font-extrabold text-[#0d1326]">
          Create a month of LinkedIn content{" "}
          <span className="bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#0891b2] bg-clip-text text-transparent">
            in minutes.
          </span>
        </h1>

        <p className="mx-auto mt-[22px] max-w-[660px] text-[18.5px] leading-[1.55] text-[#5a667a]">
          linkedinpost.ai writes, reviews, designs, and schedules LinkedIn posts
          through an AI content council — with your approval before anything goes
          live.
        </p>

        <div className="mt-[30px] flex items-center justify-center gap-[13px]">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-[11px] bg-[#4f46e5] px-6 py-[13px] text-[15.5px] font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.32)] transition-all hover:-translate-y-px hover:bg-[#4338ca]"
          >
            Start Free <MsIcon name="arrow_forward" size={18} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-[11px] border border-[#e3e6ef] bg-white px-[22px] py-[13px] text-[15.5px] font-semibold text-[#1e293b] transition-colors hover:border-[#cbd2e0] hover:bg-[#fbfbfd]"
          >
            View Pricing
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-[22px]">
          {[
            "5 free posts/month",
            "No credit card required",
            "Built for LinkedIn creators",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-[7px] text-[13.5px] font-medium text-[#64748b]"
            >
              <MsIcon name="check_circle" size={17} className="text-[#16a34a]" />
              {item}
            </span>
          ))}
        </div>

        <HeroDashboardMockup />
      </div>
    </section>
  );
}

export function TrustBar() {
  return (
    <section className="mx-auto max-w-[1180px] px-7 pb-2 pt-[34px]">
      <p className="mb-[18px] text-center text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
        Trusted by content teams and solo creators alike
      </p>
      <div className="flex flex-wrap items-center justify-center gap-[46px] opacity-[0.62]">
        {TRUST_LOGOS.map((logo) => (
          <span
            key={logo}
            className="font-display text-[19px] font-extrabold text-[#475569] tracking-tight"
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  );
}
