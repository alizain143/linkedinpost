import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLdFromItems,
  JsonLd,
} from "@/components/seo/json-ld";
import { LinkedInTextFormatter } from "@/components/tools/linkedin-text-formatter";
import { MsIcon } from "@/components/ui/ms-icon";
import { pageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site";

const TITLE = "LinkedIn Text Formatter: Bold, Italic & Bullets";
const DESCRIPTION =
  "Free LinkedIn text formatter for Unicode bold, italic, and bullets. Style your post in the browser, copy, and paste. No signup.";

const FAQS = [
  {
    q: "Does LinkedIn support bold and italic in posts?",
    a: "Not the way a doc editor does. There is no native rich-text bold button for standard posts. Unicode mathematical bold and italic characters are widely accepted in posts, which is what this formatter produces.",
  },
  {
    q: "Will styled Unicode text hurt my reach?",
    a: "Used sparingly for emphasis, it is common and usually fine. Over-styling whole paragraphs can look spammy and harder to read on mobile. Highlight a headline, a key phrase, or a short list, then leave the rest plain.",
  },
  {
    q: "Why do some characters stay unchanged?",
    a: "This tool maps a-z, A-Z, and 0-9 for bold, and letters for italic. Punctuation, emoji, and many symbols stay as-is because there is no clean mathematical styled equivalent. That keeps the output predictable.",
  },
  {
    q: "Are Unicode bullets different from LinkedIn list formatting?",
    a: "Yes. The bullets option prefixes lines with a Unicode bullet character. LinkedIn may also offer native list controls on some surfaces. Unicode bullets travel with the text when you copy between tools.",
  },
  {
    q: "Is my text sent to a server?",
    a: "No. Formatting happens entirely in your browser. Nothing is uploaded for this tool, and you do not need an account.",
  },
  {
    q: "Can I combine this with the character counter?",
    a: "Yes. Style a short block here, copy it, then paste into the LinkedIn character counter to check see more length before you publish.",
  },
];

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/linkedin-text-formatter",
  openGraphImage: "/tools/linkedin-text-formatter/opengraph-image",
  openGraphImageAlt: TITLE,
});

export default function LinkedInTextFormatterPage() {
  const siteUrl = getSiteUrl().origin;

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          {
            name: "LinkedIn Text Formatter",
            path: "/tools/linkedin-text-formatter",
          },
        ]}
      />
      <FaqPageJsonLdFromItems items={FAQS} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "LinkedIn Text Formatter",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          url: `${siteUrl}/tools/linkedin-text-formatter`,
          description: DESCRIPTION,
        }}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Free tool
          </div>
          <h1 className="pp-hero-h1 font-display text-[40px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326] sm:text-[48px]">
            LinkedIn Text Formatter: Bold, Italic &amp; Bullets
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] border-l-4 border-[#6366f1] pl-5 text-left text-lg leading-[1.55] text-[#5a667a]">
            Turn plain text into Unicode bold, italic, or bulleted lines you can
            paste into LinkedIn. It runs in your browser only. No signup.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[960px] px-7 py-12">
        <LinkedInTextFormatter />
      </section>

      <section className="mx-auto max-w-[760px] px-7 pb-12">
        <article className="space-y-8 text-[15.5px] leading-[1.7] text-[#475569]">
          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              How to use it
            </h2>
            <p>
              Type or paste your text in the input panel. Choose Plain, Bold,
              Italic, or Bullets. The output updates right away with Unicode
              substitutions for supported letters and digits. Copy the output,
              paste into LinkedIn, and skim the native preview on mobile if you
              can. A little emphasis usually reads better than an entire post in
              mathematical bold.
            </p>
            <p className="mt-4">
              A simple workflow: write the post in plain text first, then style
              only the hook or a short list. If you style while drafting, you
              tend to decorate every sentence. Keep a plain version handy so you
              can fall back if a device renders the Unicode awkwardly.
            </p>
            <p className="mt-4">
              Nothing leaves your browser for this tool. Clear the fields when
              you are done if you are on a shared machine. There is no account
              wall and no watermark.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              Why Unicode styling shows up in LinkedIn
            </h2>
            <p>
              Standard LinkedIn posts are mostly plain text. They do not behave
              like a Google Doc with toggleable rich formatting for every
              sentence. Unicode includes mathematical bold and italic letter
              forms that look styled even inside plain-text fields. LinkedIn
              generally accepts those characters in posts, which is why
              formatters like this exist.
            </p>
            <p className="mt-4">
              That also means accessibility and search quirks can show up. Screen
              readers may announce styled characters differently. Matching and
              copying can feel odd if someone tries to search for the plain
              spelling inside a bold stretch. Some analytics or CRM tools may
              treat the styled string as a different word. Use styling as
              emphasis, not as your default typeface for every line.
            </p>
            <p className="mt-4">
              Digits map to bold forms as well. Punctuation, emoji, and many
              symbols stay unchanged because there is no clean one-to-one styled
              equivalent. That keeps the output predictable when your draft mixes
              numbers, URLs, and short codes.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              Bold, italic, and bullets in practice
            </h2>
            <p>
              Bold works well for a one-line hook, a section label, or a single
              phrase you want to stand out in a wall of text. Italic suits a
              short aside or a quoted customer line. Bullets help when you have
              three to five concrete items and want them scannable on a phone. If
              a list grows past five, ask whether the post should become a
              carousel instead.
            </p>
            <p className="mt-4">
              After you style a block, check length. Unicode characters still
              count as characters. Use the free{" "}
              <Link
                href="/tools/linkedin-character-counter"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                LinkedIn character counter
              </Link>{" "}
              to see where the see more fold lands around 1,300 characters. If
              your hook needs more punch before that fold, study{" "}
              <Link
                href="/guides/linkedin-hooks-that-get-engagement"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                LinkedIn hooks that get engagement
              </Link>
              . Formatting cannot rescue a weak opener. It can only help a clear
              opener travel farther in a crowded feed.
            </p>
            <p className="mt-4">
              Avoid stacking every trick at once: bold hook, italic body, emoji
              bullets, and a long hashtag row. Pick one visual device that
              supports the point. Readers on LinkedIn already scroll past noise
              all day. Restraint usually looks more confident than decoration. If
              a styled line looks wrong after paste, switch back to Plain, copy
              the original, and try styling a shorter span instead.
            </p>
            <p className="mt-4">
              A quick check before you publish: read the styled line out loud. If
              it sounds like a flyer, pull back. If it just marks the one sentence
              you want people to notice, you are in the right range.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              When formatting is not the bottleneck
            </h2>
            <p>
              Formatters and counters are finishing tools. They help after you
              know what you want to say. If you need help generating drafts that
              match your voice, reviewing them before publish, and planning a
              month of posts, that is the product lane for linkedinpost.ai. The
              goal is not prettier characters. The goal is posts you would stand
              behind if someone quoted them in a meeting.
            </p>
            <p className="mt-4">
              Browse{" "}
              <Link
                href="/features"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                features
              </Link>{" "}
              for AI Council review, calendars, and agency workspaces. Check{" "}
              <Link
                href="/pricing"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                pricing
              </Link>{" "}
              when you want plan details. Or{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                start free
              </Link>{" "}
              when you are ready to move past one-off formatting. Until then,
              keep using this page with no signup whenever you need styled
              LinkedIn text in a hurry.
            </p>
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-12">
        <h2 className="mb-5 text-center font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          Common questions
        </h2>
        <div className="flex flex-col gap-3.5">
          {FAQS.map((faq) => (
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
          See all free utilities on the{" "}
          <Link
            href="/tools"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            tools hub
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto max-w-[1180px] px-7 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#6d3fe0] to-[#0891b2] px-10 py-14 text-center shadow-[0_30px_70px_-30px_rgba(79,70,229,0.6)]">
          <div className="relative">
            <h2 className="font-display text-[32px] font-extrabold leading-[1.12] tracking-[-0.025em] text-white">
              Need more than formatting?
            </h2>
            <p className="mx-auto mt-3.5 max-w-[480px] text-[16px] leading-[1.55] text-white/[0.86]">
              Style text here for free. Use linkedinpost.ai when you want
              voice-aware drafts, review, and a content calendar.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-bold text-[#4338ca] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5"
              >
                Start free <MsIcon name="arrow_forward" size={18} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/18"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
