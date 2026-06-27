"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LinkedInCallbackHandler } from "@/components/app/linkedin-callback-handler";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { AppUiProvider } from "@/providers/app-ui-provider";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useCurrentUser();

  return (
    <AppUiProvider>
      <Suspense fallback={null}>
        <LinkedInCallbackHandler />
      </Suspense>
      <AppShell pathname={pathname}>{children}</AppShell>
    </AppUiProvider>
  );
}
