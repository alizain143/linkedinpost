"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTour } from "@/providers/tour-provider";

/**
 * Auto-starts product-core-v1 once when the user has not seen it yet.
 */
export function ProductTourAutoStart() {
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();
  const { activeWorkspaceId } = useWorkspace();
  const { startProductTour, hasSeenProductTour, isTourRunning } = useTour();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current || isTourRunning) return;
    if (isLoading || !user || !activeWorkspaceId) return;
    if (hasSeenProductTour) return;
    if (!pathname.startsWith("/app/")) return;

    attemptedRef.current = true;
    const timer = window.setTimeout(() => {
      startProductTour();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    activeWorkspaceId,
    hasSeenProductTour,
    isLoading,
    isTourRunning,
    pathname,
    startProductTour,
    user,
  ]);

  return null;
}
