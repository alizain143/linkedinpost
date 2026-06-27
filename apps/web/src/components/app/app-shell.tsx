"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/generate": "Generate",
  "/app/autopilot": "Autopilot",
  "/app/pipeline": "Pipeline",
  "/app/calendar": "Calendar",
  "/app/approvals": "Approvals",
  "/app/clients": "Clients",
  "/app/profile": "Content Profile",
  "/app/billing": "Billing",
  "/app/settings": "Settings",
};

type AppShellProps = {
  children: React.ReactNode;
  pathname: string;
};

export function AppShell({ children, pathname }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

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
