"use client";

import {
  useInvalidateLinkedIn,
  useSyncLinkedInProfile,
} from "@/hooks/api/use-linkedin-api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePpToast } from "@/providers/pp-toast-provider";

export function LinkedInCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = usePpToast();
  const syncProfile = useSyncLinkedInProfile();
  const invalidateLinkedIn = useInvalidateLinkedIn();
  const handledRef = useRef(false);

  useEffect(() => {
    const linkedin = searchParams.get("linkedin");
    if (!linkedin || handledRef.current) return;

    handledRef.current = true;

    if (linkedin === "connected") {
      showToast("LinkedIn connected", "link");
      void syncProfile
        .mutateAsync()
        .then(() => {
          invalidateLinkedIn();
        })
        .catch(() => {
          showToast("Connected, but profile sync is pending", "link");
          invalidateLinkedIn();
        });
    } else if (linkedin === "error") {
      showToast(
        searchParams.get("message") ?? "Could not connect LinkedIn",
        "link_off",
      );
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("linkedin");
    url.searchParams.delete("message");
    router.replace(url.pathname + url.search);
  }, [invalidateLinkedIn, router, searchParams, showToast, syncProfile]);

  return null;
}
