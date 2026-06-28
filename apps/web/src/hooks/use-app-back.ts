"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

function canNavigateBack(): boolean {
  if (typeof window === "undefined") return false;
  return window.history.length > 1;
}

export function useAppBack(fallbackHref: string) {
  const router = useRouter();

  return useCallback(() => {
    if (canNavigateBack()) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [router, fallbackHref]);
}
