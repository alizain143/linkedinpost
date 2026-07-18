"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LinkedInCallbackHandler } from "@/components/app/linkedin-callback-handler";
import { PlanUnlockWatcher } from "@/components/app/plan-unlock-watcher";
import { ProductTourAutoStart } from "@/components/app/product-tour-auto-start";
import { PushNotificationPrompt } from "@/components/app/push-notification-prompt";
import { PushNotificationsRuntime } from "@/components/app/push-notifications-runtime";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useBillingStatus } from "@/hooks/api/use-billing-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { AppUiProvider } from "@/providers/app-ui-provider";
import { TourProvider } from "@/providers/tour-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useCurrentUser();
  useCredits();
  useBillingStatus();

  return (
    <Suspense fallback={null}>
      <WorkspaceProvider>
        <AppUiProvider>
          <TourProvider>
            <Suspense fallback={null}>
              <LinkedInCallbackHandler />
            </Suspense>
            <AppShell pathname={pathname}>{children}</AppShell>
            <ProductTourAutoStart />
            <PlanUnlockWatcher />
            <PushNotificationsRuntime />
            <PushNotificationPrompt />
          </TourProvider>
        </AppUiProvider>
      </WorkspaceProvider>
    </Suspense>
  );
}
