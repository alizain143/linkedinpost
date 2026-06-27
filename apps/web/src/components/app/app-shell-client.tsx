"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { AppUiProvider } from "@/providers/app-ui-provider";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AppUiProvider>
      <AppShell pathname={pathname}>{children}</AppShell>
    </AppUiProvider>
  );
}
