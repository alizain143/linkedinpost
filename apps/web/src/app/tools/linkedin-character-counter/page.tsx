import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLdFromItems,
  JsonLd,
} from "@/components/seo/json-ld";
import { LinkedInCharacterCounter } from "@/components/tools/linkedin-character-counter";
import { MsIcon } from "@/components/ui/ms-icon";
import { pageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site";

const TITLE = "LinkedIn Character Counter: See More Cutoff & Preview";
const DESCRIPTION =
  "Free LinkedIn character counter with live word count, see more around 1,300 characters, and a side-by-side preview. No signup.";

const FAQS = [
  {
    q: "Where does LinkedIn cut off with see more?",
    a: "On a lot of posts, LinkedIn folds the feed view somewhere around 1,300 characters and shows see more. It can shift by device and surface, so treat 1,300 as a planning marker, not a hard API rule.",
  },
  {
    q: "Is 3,000 characters the LinkedIn post limit?",
    a: "People often treat about 3,000 characters as a practical ceiling for standard posts. Limits have changed before, and some formats behave differently. Shape the draft here, then confirm in LinkedIn's own composer before you publish.",
  },
  {
    q: "Does this tool count spaces and line breaks?",
    a: "Yes. Character count includes spaces, punctuation, and newlines. Word count splits on whitespace. Estimated lines assume roughly 60 characters per wrapped line, plus any hard breaks you typed.",
  },
  {
    q: "Why mention ~140 characters as well?",
    a: "Some LinkedIn surfaces used to truncate previews closer to about 140 characters. That short window is separate from the longer in-post see more expand. Plan for both: a strong first beat, then a clean place to expand around 1,300.",
  },
  {
    q: "Do I need an account to use this counter?",
    a: "No. It runs in your browser with no signup. If you later want AI drafts, calendars, and review workflows, you can start free on linkedinpost.ai.",
  },
  {
    q: "Can I copy my draft from here into LinkedIn?",
    a: "Yes. Hit copy, paste into LinkedIn, and skim the native preview once. Formatting and media still happen in LinkedIn, not on this page.",
  },
];

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/linkedin-character-counter",
  openGraphImage: "/tools/linkedin-character-counter/opengraph-image",
  openGraphImageAlt: TITLE,
});

export default function LinkedInCharacterCounterPage() {
  const siteUrl = getSiteUrl().origin;

  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          {
            name: "LinkedIn Character Counter",
            path: "/tools/linkedin-character-counter",
          },
        ]}
      />
      <FaqPageJsonLdFromItems items={FAQS} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "LinkedIn Character Counter",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          url: `${siteUrl}/tools/linkedin-character-counter`,
          description: DESCRIPTION,
        }}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Free tool
          </div>
          <h1 className="pp-hero-h1 font-display text-[40px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326] sm:text-[48px]">
            LinkedIn Character Counter: See More Cutoff &amp; Preview
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] border-l-4 border-[#6366f1] pl-5 text-left text-lg leading-[1.55] text-[#5a667a]">
            Paste your draft and see characters, words, and estimated lines
            update as you type. The marker at 1,300 characters is where LinkedIn
            usually puts see more. You get the truncated feed view next to the
            full post. No signup.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[960px] px-7 py-12">
        <LinkedInCharacterCounter />
      </section>

      <section className="mx-auto max-w-[760px] px-7 pb-12">
        <article className="space-y-8 text-[15.5px] leading-[1.7] text-[#475569]">
          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              How to use it
            </h2>
            <p>
              Paste your draft into the box above. You get a live character count
              (spaces and line breaks count), a word count, and a rough line
              estimate based on wrapping around 60 characters per line. Keep an
              eye on the bar as you near 1,300 characters. That is the see more
              marker this tool is built around. Once you cross it, the truncated
              panel shows what someone in the feed is likely to see before they
              expand. The other panel keeps the whole post so you can compare
              without guessing.
            </p>
            <p className="mt-4">
              If you can, write in three passes. First, get the story down
              without worrying about length. Second, fix the opening so the
              truncated preview still makes sense on its own. Third, cut the
              middle filler so the expand rewards the click instead of repeating
              the hook. When it feels right, copy and paste into LinkedIn.
            </p>
            <p className="mt-4">
              Nothing here is stored on a server. The counter runs in your
              browser, so you can iterate privately before you publish. Clear the
              field if you are on a shared computer.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              The numbers people mix up
            </h2>
            <p>
              People talk about LinkedIn length as if there is one number. There
              are a few, and they do different jobs.
            </p>
            <p className="mt-4">
              Historically, some feed surfaces truncated previews around roughly
              140 characters. That short window is why your opening lines matter.
              A lot of people decide whether to expand from the first beat alone.
              Soft line one, and the rest of the post never gets a fair shot.
            </p>
            <p className="mt-4">
              Separately, the in-post see more expand for longer posts commonly
              sits around 1,300 characters. That is the marker this tool shows.
              Crossing it is fine. Plenty of strong posts put the payoff after
              see more on purpose. The problem is burying the point before the
              fold with no reason to click, or filling the truncated view with
              throat-clearing that says nothing.
            </p>
            <p className="mt-4">
              Creators also cite about 3,000 characters as a practical upper
              bound for many standard posts. Limits can shift by format and over
              time, so treat 3,000 as a planning ceiling, then check LinkedIn&apos;s
              composer. If your draft is climbing past that range, ask whether it
              wants to be a long-form article, a carousel, or a tighter narrative
              instead. Longer is not automatically more thoughtful. Often it is
              three posts wearing one coat.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              Working with the cutoff
            </h2>
            <p>
              Put the conflict, insight, or specific outcome in the first two or
              three lines. Vague openers like &quot;I&apos;ve been thinking about
              leadership lately&quot; rarely earn the expand. Specific ones do: a
              number, a failed experiment, a customer sentence, or a sharp claim
              you can defend in the comments.
            </p>
            <p className="mt-4">
              Use short lines and white space. Dense paragraphs look longer than
              they are on mobile, and they make the fold feel earlier even when
              the character count is fine. Break before a reveal. Leave room
              after a question. If you need bullets for scannability, try the
              free{" "}
              <Link
                href="/tools/linkedin-text-formatter"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                LinkedIn text formatter
              </Link>{" "}
              for Unicode bullets, then paste back here to re-check length.
              Styled characters still count toward the total.
            </p>
            <p className="mt-4">
              Hooks deserve their own practice. For concrete opener patterns,
              read{" "}
              <Link
                href="/guides/linkedin-hooks-that-get-engagement"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                LinkedIn hooks that get engagement
              </Link>
              . Pair a strong hook with a length plan and you stop guessing
              whether the fold is working against you. A simple test: cover
              everything after the first 1,300 characters and ask if the visible
              part still earns a click from someone who does not know you.
            </p>
            <p className="mt-4">
              One more habit that helps: check the truncated panel at a
              phone-width window when you can. Desktop makes everything look more
              forgiving. The same draft that feels fine on a wide screen can look
              like a wall of text before see more on a phone. If the preview
              feels cramped, add line breaks before you cut meaning.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
              When a counter is enough
            </h2>
            <p>
              A character counter solves one job: length awareness before you
              publish. If you already know what to say and only need to shape the
              draft, stay here. If blank-page days are the real bottleneck,
              length is not your product problem. You need a repeatable way to
              get from idea to reviewed draft without starting from zero every
              Tuesday.
            </p>
            <p className="mt-4">
              linkedinpost.ai is built for the rest of that loop: voice-aware
              drafts, multi-agent review, calendars, and approval when more than
              one person touches the post. See{" "}
              <Link
                href="/features"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                features
              </Link>{" "}
              for what ships today, and{" "}
              <Link
                href="/pricing"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                pricing
              </Link>{" "}
              when you want the plan picture. You can{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                start free
              </Link>{" "}
              when you are ready. Until then, use this tool with no signup and
              keep it bookmarked for the last check before you hit publish.
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
          More free utilities live on the{" "}
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
              Ready for drafts that sound like you?
            </h2>
            <p className="mx-auto mt-3.5 max-w-[480px] text-[16px] leading-[1.55] text-white/[0.86]">
              Keep this counter for length checks. Use linkedinpost.ai when you
              want voice-aware generation, review, and a calendar.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-bold text-[#4338ca] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5"
              >
                Start free <MsIcon name="arrow_forward" size={18} />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/18"
              >
                See features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
