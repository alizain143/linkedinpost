"use client";

import { Footer } from "@/components/layout/marketing-footer";
import { Nav } from "@/components/layout/nav";

type MarketingLayoutProps = {
  children: React.ReactNode;
  hideNav?: boolean;
};

export function MarketingLayout({
  children,
  hideNav = false,
}: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#0f172a]">
      {!hideNav ? <Nav /> : null}
      <main>{children}</main>
      <Footer />
    </div>
  );
}
