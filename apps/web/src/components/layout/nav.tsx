"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { MsIcon } from "@/components/ui/ms-icon";
import { MARKETING_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavProps = {
  variant?: "landing" | "subpage";
};

export function Nav({ variant: _variant = "subpage" }: NavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 840) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#eceef3] bg-white/[0.82] backdrop-blur-[14px] backdrop-saturate-[160%]">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-7 py-[14px]">
        <div className="flex items-center gap-[34px]">
          <Brand href="/" />
          <nav className="pp-mk-links">
            {MARKETING_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-[13px] py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-[#f1f3f8] hover:text-[#0f172a]",
                  isActive(link.href) &&
                    "bg-[#eef2ff] font-semibold text-[#4338ca]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/sign-in"
            className="pp-mk-links rounded-[9px] bg-transparent px-[15px] py-[9px] text-sm font-semibold text-[#475569] transition-colors hover:bg-[#f1f3f8] hover:text-[#0f172a]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="pp-mk-cta rounded-[9px] bg-[#4f46e5] px-[18px] py-[9px] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.28)] transition-colors hover:bg-[#4338ca]"
          >
            Start Free
          </Link>
          <button
            type="button"
            className="pp-mk-burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MsIcon
              name={menuOpen ? "close" : "menu"}
              size={21}
              className="text-[#475569]"
            />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="pp-mk-drawer flex flex-col gap-0.5 border-t border-[#eceef3] bg-white px-5 pb-4 pt-2.5">
          {MARKETING_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[9px] px-3 py-[11px] text-[15px] font-semibold text-[#1e293b] hover:bg-[#f1f3f8]"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="rounded-[9px] px-3 py-[11px] text-[15px] font-semibold text-[#1e293b] hover:bg-[#f1f3f8]"
            onClick={() => setMenuOpen(false)}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[9px] bg-[#4f46e5] px-3 py-[11px] text-center text-[15px] font-semibold text-white hover:bg-[#4338ca]"
            onClick={() => setMenuOpen(false)}
          >
            Start Free
          </Link>
        </div>
      ) : null}
    </header>
  );
}
