import Link from "next/link";
import { PricingCurrencyNote } from "@/components/pricing/plan-price";
import { MsIcon } from "@/components/ui/ms-icon";
import { PlanCard, SectionHeader } from "@/components/sections/marketing/shared";
import {
  FAQS,
  FEATURES,
  PLANS,
  PROBLEMS,
  STEPS,
} from "@/lib/marketing-data";

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-[1180px] px-7 py-16">
      <div className="mb-10 text-center">
        <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
          The blank page problem
        </div>
        <h2 className="mx-auto max-w-[620px] font-display text-[38px] font-extrabold leading-[1.12] tracking-[-0.025em] text-[#0f172a]">
          Posting on LinkedIn shouldn&apos;t feel this hard.
        </h2>
      </div>
      <div className="pp-grid3">
        {PROBLEMS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-[#eceef4] bg-white p-[26px]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fef2f2]">
              <MsIcon name={p.icon} size={23} className="text-[#e0556b]" />
            </div>
            <h3 className="mb-2 font-display text-[18.5px] font-bold leading-[1.32] tracking-[-0.01em]">
              {p.title}
            </h3>
            <p className="text-[14.5px] leading-[1.6] text-[#64748b]">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how" className="bg-[#0d1326] text-white">
      <div className="mx-auto max-w-[1180px] px-7 py-[72px]">
        <div className="mb-12 text-center">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#a5b4fc]">
            How it works
          </div>
          <h2 className="font-display text-[38px] font-extrabold leading-[1.12] tracking-[-0.025em]">
            From blank page to a full content system.
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px] leading-[1.55] text-[#9aa6be]">
            Four steps to a repeatable LinkedIn workflow that actually sounds like
            you.
          </p>
        </div>
        <div className="pp-grid4">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6"
            >
              <div className="mb-4 flex items-center gap-[11px]">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
                  <MsIcon name={s.icon} size={20} className="text-white" />
                </div>
                <span className="font-display text-sm font-extrabold text-[#6c79a3]">
                  {s.num}
                </span>
              </div>
              <h3 className="mb-2 font-display text-[16.5px] font-bold tracking-[-0.01em]">
                {s.title}
              </h3>
              <p className="text-[13.5px] leading-[1.55] text-[#9aa6be]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-[1180px] px-7 py-[72px]">
      <div className="mb-11 text-center">
        <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
          Everything you need
        </div>
        <h2 className="mx-auto max-w-[640px] font-display text-[38px] font-extrabold leading-[1.12] tracking-[-0.025em]">
          A content operating system, not a chatbot.
        </h2>
      </div>
      <div className="pp-grid4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[#eceef4] bg-white p-[22px] transition hover:-translate-y-0.5 hover:border-[#dfe3f0] hover:shadow-[0_10px_28px_-16px_rgba(24,28,64,0.22)]"
          >
            <div
              className="mb-[15px] flex h-[42px] w-[42px] items-center justify-center rounded-xl"
              style={{ background: f.tint }}
            >
              <MsIcon name={f.icon} size={22} style={{ color: f.color }} />
            </div>
            <h3 className="mb-[7px] font-display text-[15.5px] font-bold tracking-[-0.01em]">
              {f.title}
            </h3>
            <p className="text-[13.5px] leading-[1.55] text-[#64748b]">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-[radial-gradient(120%_100%_at_50%_0%,#eef0ff_0%,#f6f7f9_42%)]"
    >
      <div className="mx-auto max-w-[1180px] px-7 py-[72px]">
        <div className="mb-[46px] text-center">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Pricing
          </div>
          <h2 className="font-display text-[38px] font-extrabold leading-[1.12] tracking-[-0.025em]">
            Simple plans that scale with your output.
          </h2>
          <p className="mx-auto mt-[15px] max-w-[520px] text-[17px] leading-[1.55] text-[#5a667a]">
            Start free, upgrade when you&apos;re ready. No credit card to begin.
          </p>
        </div>
        <div className="pp-grid4 items-stretch pt-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
        <PricingCurrencyNote className="mt-5" />
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="border-y border-[#eef0f5] bg-[#fbfbfd]">
      <div className="mx-auto max-w-[880px] px-7 py-[72px]">
        <div className="mb-10 text-center">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            FAQ
          </div>
          <h2 className="font-display text-[36px] font-extrabold leading-[1.12] tracking-[-0.025em]">
            Questions, answered.
          </h2>
        </div>
        <div className="flex flex-col gap-3.5">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="rounded-[14px] border border-[#eceef4] bg-white px-6 py-[22px]"
            >
              <div className="mb-2 flex items-start gap-3">
                <MsIcon name="help" size={20} className="shrink-0 text-[#4f46e5]" />
                <h3 className="font-display text-[16.5px] font-bold tracking-[-0.01em]">
                  {f.q}
                </h3>
              </div>
              <p className="ml-8 text-[14.5px] leading-[1.62] text-[#64748b]">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-[1180px] px-7 pb-20 pt-14">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#6d3fe0] to-[#0891b2] px-10 py-16 text-center shadow-[0_30px_70px_-30px_rgba(79,70,229,0.6)]">
        <div className="pointer-events-none absolute -left-[10%] -top-[40%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-[50%] -right-[5%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.13),transparent_70%)]" />
        <div className="relative">
          <h2 className="font-display text-[42px] font-extrabold leading-[1.1] tracking-[-0.025em] text-white">
            Stop starting from a blank page.
          </h2>
          <p className="mx-auto mt-[18px] max-w-[520px] text-lg leading-[1.55] text-white/[0.86]">
            Generate your first LinkedIn posts free and build your weekly content
            system today.
          </p>
          <Link
            href="/sign-up"
            className="mt-[30px] inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-[#4338ca] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5"
          >
            Start Free <MsIcon name="arrow_forward" size={19} />
          </Link>
        </div>
      </div>
    </section>
  );
}
