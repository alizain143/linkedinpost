import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { MsIcon } from "@/components/ui/ms-icon";
import { pageMetadata } from "@/lib/seo/metadata";

const TOOLS = [
  {
    name: "LinkedIn Character Counter",
    path: "/tools/linkedin-character-counter",
    description:
      "Live character, word, and line counts, plus a 1,300-character see more marker and truncated vs full preview.",
    icon: "draft",
  },
  {
    name: "LinkedIn Text Formatter",
    path: "/tools/linkedin-text-formatter",
    description:
      "Turn plain text into Unicode bold, italic, or bullets you can paste into LinkedIn.",
    icon: "edit",
  },
] as const;

export const metadata: Metadata = pageMetadata({
  title: "Free LinkedIn Tools: Character Counter & Text Formatter",
  description:
    "Free LinkedIn tools from linkedinpost.ai: character counter with see more preview, and Unicode bold, italic, and bullet formatter. No signup.",
  path: "/tools",
  openGraphImage: "/tools/opengraph-image",
  openGraphImageAlt: "Free LinkedIn tools from linkedinpost.ai",
});

export default function ToolsHubPage() {
  return (
    <MarketingLayout>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
        ]}
      />
      <ItemListJsonLd
        name="Free LinkedIn tools"
        description="Free LinkedIn utilities from linkedinpost.ai for counting characters and formatting post text."
        items={TOOLS.map((tool) => ({
          name: tool.name,
          path: tool.path,
          description: tool.description,
        }))}
      />

      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[920px] px-7 pb-[52px] pt-[66px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Tools
          </div>
          <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            Free LinkedIn tools. No signup.
          </h1>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-[1.55] text-[#5a667a]">
            Quick utilities for post length and Unicode formatting. Use them
            without an account, then jump into linkedinpost.ai when you want
            drafts, calendars, and review.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 py-12">
        <div className="flex flex-col gap-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.path}
              href={tool.path}
              className="block rounded-[18px] border border-[#eceef4] bg-white p-6 shadow-[0_1px_2px_rgba(24,28,64,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#eef2ff] text-[#4f46e5]">
                    <MsIcon name={tool.icon} size={22} />
                  </div>
                  <div>
                    <h2 className="font-display text-[22px] font-extrabold tracking-tight text-[#0f172a]">
                      {tool.name}
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <MsIcon
                  name="arrow_forward"
                  size={22}
                  className="mt-1 shrink-0 text-[#4f46e5]"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-7 pb-16 text-center">
        <p className="mb-6 text-[15px] text-[#64748b]">
          Want the full workflow? See{" "}
          <Link
            href="/features"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            features
          </Link>
          ,{" "}
          <Link
            href="/pricing"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            pricing
          </Link>
          , or{" "}
          <Link
            href="/guides"
            className="font-semibold text-[#4f46e5] hover:underline"
          >
            guides
          </Link>
          .
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_22px_rgba(79,70,229,0.3)] transition-colors hover:bg-[#4338ca]"
        >
          Try linkedinpost.ai free <MsIcon name="arrow_forward" size={19} />
        </Link>
      </section>
    </MarketingLayout>
  );
}
