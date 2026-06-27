"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppUi } from "@/providers/app-ui-provider";

type AppSidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {APP_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-[11px] rounded-[9px] px-[11px] py-2 text-[13px] transition-colors",
              active
                ? "bg-[#eef2ff] font-semibold text-[#4338ca]"
                : "font-medium text-[#64748b] hover:bg-[#f6f7fb]",
            )}
          >
            <MsIcon
              name={item.icon}
              size={20}
              className={active ? "text-[#4338ca]" : "text-[#94a3b8]"}
            />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppSidebar({ mobileOpen, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { confirmLogout } = useAppUi();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] hidden bg-black/30 max-[920px]:block"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[61] flex w-[248px] flex-col border-r border-[#eceef3] bg-white transition-transform max-[920px]:flex min-[921px]:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-4 pb-3 pt-[18px]">
          <Brand href="/app/dashboard" size="sm" />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
          <NavLinks pathname={pathname} onNavigate={onCloseMobile} />
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="pp-sidebar sticky top-0 hidden h-screen flex-col border-r border-[#eceef3] bg-white min-[921px]:flex">
        <div className="px-4 pb-2 pt-[18px]">
          <Brand href="/app/dashboard" size="sm" />
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[10px] border border-[#eceef4] bg-[#f8f9fc] px-[11px] py-[9px] text-left"
          >
            <div className="flex min-w-0 items-center gap-[9px]">
              <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-[#4f46e5] to-[#0891b2] font-display text-[11px] font-bold text-white">
                M
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold leading-tight">
                  Maya&apos;s Workspace
                </div>
                <div className="text-[10.5px] text-[#94a3b8]">Personal</div>
              </div>
            </div>
            <MsIcon name="unfold_more" size={17} className="shrink-0 text-[#94a3b8]" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="border-t border-[#f1f3f8] px-[14px] pb-4 pt-[14px]">
          <div className="mb-3 rounded-[13px] border border-[#e6e8ff] bg-gradient-to-br from-[#f6f5ff] to-[#eef2ff] p-[13px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#4338ca]">Credits</span>
              <span className="font-display text-xs font-bold text-[#4338ca]">
                23 / 50
              </span>
            </div>
            <div className="mb-[11px] h-[7px] overflow-hidden rounded-full bg-[#e0e3ff]">
              <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />
            </div>
            <Button
              href="/app/billing"
              variant="primary"
              size="xs"
              fullWidth
              className="py-2"
            >
              Upgrade Plan
            </Button>
          </div>

          <div className="flex items-center gap-2.5 px-0.5 py-1">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fb7185] to-[#f43f5e] font-display text-[13px] font-bold text-white">
              MR
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-[#1e293b]">
                Maya Reyes
              </div>
              <div className="truncate text-[11px] text-[#94a3b8]">
                maya@northbeam.co
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
              PRO
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-[30px] shrink-0 rounded-lg"
              aria-label="Log out"
              onClick={confirmLogout}
            >
              <MsIcon name="logout" size={18} className="text-[#94a3b8]" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
