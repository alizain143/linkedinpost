"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MarketingLayout>
      <section className="border-b border-[#eef0f5] bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
        <div className="mx-auto max-w-[720px] px-7 pb-20 pt-[72px] text-center">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
            Something went wrong
          </div>
          <h1 className="font-display text-[44px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
            We hit an unexpected error.
          </h1>
          <p className="mx-auto mt-5 max-w-[520px] text-lg leading-[1.55] text-[#5a667a]">
            Try again in a moment. If it keeps happening, head home or contact
            support.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={reset}>
              Try again
            </Button>
            <Button href="/" variant="secondary" size="lg">
              Go home
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Contact us <MsIcon name="arrow_forward" size={18} />
            </Button>
          </div>
          {error.digest ? (
            <p className="mt-8 text-xs text-[#94a3b8]">
              Error reference: {error.digest}
            </p>
          ) : (
            <p className="mt-8 text-sm text-[#64748b]">
              Or browse{" "}
              <Link
                href="/guides"
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                our guides
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
