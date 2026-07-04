"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditsMeter } from "@/components/app/credits-meter";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  useCurrentUser,
  getUserDisplayName,
  getUserInitials,
} from "@/hooks/api/use-auth-api";
import { useCredits } from "@/hooks/api/use-credits-api";
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
        const active =
          pathname === item.href ||
          (item.href !== "/app/dashboard" &&
            pathname.startsWith(`${item.href}/`));
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

function SidebarUserFooter() {
  const { confirmLogout } = useAppUi();
  const { data: user } = useCurrentUser();
  const { balance } = useCredits();

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const email = user?.email ?? "";
  const planLabel = (balance?.plan ?? user?.plan ?? "free").toUpperCase();
  const profileImageUrl = user?.profileImageUrl;

  return (
    <>
      <CreditsMeter />
      <div className="flex items-center gap-2.5 px-0.5 py-1">
        <div className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#fb7185] to-[#f43f5e]">
          {profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-[13px] font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-[#1e293b]">
            {displayName}
          </div>
          <div className="truncate text-[11px] text-[#94a3b8]">{email}</div>
        </div>
        <span className="shrink-0 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
          {planLabel}
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
    </>
  );
}

export function AppSidebar({ mobileOpen, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();

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
        <div className="px-3 pb-2">
          <WorkspaceSwitcher />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
          <NavLinks pathname={pathname} onNavigate={onCloseMobile} />
        </nav>
        <div className="border-t border-[#f1f3f8] px-[14px] pb-4 pt-[14px]">
          <SidebarUserFooter />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="pp-sidebar sticky top-0 hidden h-screen flex-col border-r border-[#eceef3] bg-white min-[921px]:flex">
        <div className="px-4 pb-2 pt-[18px]">
          <Brand href="/app/dashboard" size="sm" />
        </div>

        <div className="px-3 pb-2">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="border-t border-[#f1f3f8] px-[14px] pb-4 pt-[14px]">
          <SidebarUserFooter />
        </div>
      </aside>
    </>
  );
}
