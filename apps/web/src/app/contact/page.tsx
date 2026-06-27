"use client";

import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { CONTACT_SUBJECT_OPTIONS } from "@/lib/form-options";
import { usePpToast } from "@/providers/pp-toast-provider";

export default function ContactPage() {
  const { showToast } = usePpToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showToast("Message sent — we'll reply within 1 business day", "send");
  };

  return (
    <MarketingLayout>
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[820px] px-7 pb-11 pt-[62px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Contact
          </div>
          <h1 className="pp-hero-h1 font-display text-[46px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            We&apos;d love to hear from you.
          </h1>
          <p className="mx-auto mt-[18px] max-w-[560px] text-[17px] leading-[1.55] text-[#5a667a]">
            Questions, feedback, or partnership ideas — send us a note and
            we&apos;ll get back within one business day.
          </p>
        </div>
      </section>

      <section className="pp-gen mx-auto max-w-[1040px] px-7 pb-16 pt-12">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[20px] border border-[#eceef4] bg-white p-[30px]"
        >
          <div className="mb-4 grid grid-cols-2 gap-4">
            <InputField
              label="First name"
              variant="marketing"
              placeholder="Maya"
            />
            <InputField
              label="Last name"
              variant="marketing"
              placeholder="Reyes"
            />
          </div>
          <InputField
            label="Work email"
            type="email"
            required
            variant="marketing"
            fieldClassName="mb-4"
            placeholder="you@company.com"
          />
          <SelectField
            label="What can we help with?"
            fieldClassName="mb-4"
            options={CONTACT_SUBJECT_OPTIONS}
            defaultValue="General question"
          />
          <TextareaField
            label="Message"
            required
            variant="marketing"
            fieldClassName="mb-5"
            className="h-[120px]"
            placeholder="Tell us a bit about what you need…"
          />
          <Button type="submit" variant="primary" size="md" className="rounded-xl shadow-[0_6px_16px_rgba(79,70,229,0.28)]">
            <MsIcon name="send" size={18} />
            Send message
          </Button>
        </form>

        <div className="flex flex-col gap-3.5">
          <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
            <div className="mb-1.5 flex items-center gap-[11px]">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#eef2ff]">
                <MsIcon name="mail" size={20} className="text-[#4f46e5]" />
              </div>
              <div className="font-display text-sm font-bold text-[#0d1326]">
                Email us
              </div>
            </div>
            <p className="text-[13.5px] leading-[1.5] text-[#64748b]">
              <a
                href="mailto:hello@linkedinpost.ai"
                className="hover:text-[#4f46e5]"
              >
                hello@linkedinpost.ai
              </a>
              <br />
              <a
                href="mailto:support@linkedinpost.ai"
                className="hover:text-[#4f46e5]"
              >
                support@linkedinpost.ai
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
            <div className="mb-1.5 flex items-center gap-[11px]">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#ecfeff]">
                <MsIcon name="schedule" size={20} className="text-[#0891b2]" />
              </div>
              <div className="font-display text-sm font-bold text-[#0d1326]">
                Response time
              </div>
            </div>
            <p className="text-[13.5px] leading-[1.5] text-[#64748b]">
              Within 1 business day, Mon–Fri.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#312e81] to-[#4338ca] p-5 text-white">
            <div className="mb-1.5 font-display text-[15px] font-bold">
              Prefer to self-serve?
            </div>
            <p className="mb-3.5 text-[13px] leading-[1.5] text-white/82">
              Most answers live in our FAQ on the pricing page.
            </p>
            <Link
              href="/pricing"
              className="inline-block rounded-[10px] bg-white px-[15px] py-[9px] text-[13px] font-semibold text-[#4338ca] transition-colors hover:bg-[#f1f1ff]"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
