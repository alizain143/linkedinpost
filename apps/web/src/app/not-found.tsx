import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Page not found",
  description: "The page you are looking for does not exist on linkedinpost.ai.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <MarketingLayout>
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[720px] px-7 pb-20 pt-[72px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            404
          </div>
          <h1 className="font-display text-[44px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            This page doesn&apos;t exist.
          </h1>
          <p className="mx-auto mt-5 max-w-[520px] text-lg leading-[1.55] text-[#5a667a]">
            The link may be broken, or the page may have moved. Try one of these
            instead.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/" size="lg">
              Go home
            </Button>
            <Button href="/pricing" variant="secondary" size="lg">
              Pricing
            </Button>
            <Button href="/guides" variant="secondary" size="lg">
              Guides
            </Button>
            <Button href="/sign-up" variant="outline" size="lg">
              Sign up <MsIcon name="arrow_forward" size={18} />
            </Button>
          </div>
          <p className="mt-8 text-sm text-[#64748b]">
            Need help?{" "}
            <Link
              href="/contact"
              className="font-semibold text-[#4f46e5] hover:underline"
            >
              Contact us
            </Link>
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
