"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LinkedInCallbackHandler } from "@/components/app/linkedin-callback-handler";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useBillingStatus } from "@/hooks/api/use-billing-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { useLinkedInConnection } from "@/hooks/api/use-linkedin-api";
import { AppUiProvider } from "@/providers/app-ui-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useCurrentUser();
  useCredits();
  useBillingStatus();
  useLinkedInConnection();

  return (
    <Suspense fallback={null}>
      <WorkspaceProvider>
        <AppUiProvider>
          <Suspense fallback={null}>
            <LinkedInCallbackHandler />
          </Suspense>
          <AppShell pathname={pathname}>{children}</AppShell>
        </AppUiProvider>
      </WorkspaceProvider>
    </Suspense>
  );
}
