"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/generate": "Generate",
  "/app/generate/calendar": "Generate calendar",
  "/app/autopilot": "Autopilot",
  "/app/pipeline": "Pipeline",
  "/app/posts": "Posts",
  "/app/calendar": "Calendar",
  "/app/approvals": "Approvals",
  "/app/clients": "Clients",
  "/app/profile": "Content Profile",
  "/app/billing": "Billing",
  "/app/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/app/posts/") && pathname !== "/app/posts") {
    return "Post detail";
  }
  if (pathname === "/app/generate/calendar") {
    return PAGE_TITLES["/app/generate/calendar"] ?? "Generate calendar";
  }
  return PAGE_TITLES[pathname] ?? "Dashboard";
}

type AppShellProps = {
  children: React.ReactNode;
  pathname: string;
};

export function AppShell({ children, pathname }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">
      <AppSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="pp-appmain">{children}</div>
      </div>
    </div>
  );
}
