"use client";

import {
  useInvalidateLinkedIn,
  useLinkedInProfile,
} from "@/hooks/api/use-linkedin-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { clearLinkedInConnectSession } from "@/lib/linkedin-connect-context";
import { needsLinkedInProfileImport } from "@/lib/linkedin-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePpToast } from "@/providers/pp-toast-provider";

export function LinkedInCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = usePpToast();
  const { activeWorkspaceId } = useWorkspace();
  const handledRef = useRef(false);

  const invalidateLinkedIn = useInvalidateLinkedIn(activeWorkspaceId);
  const { data: linkedInProfile } = useLinkedInProfile(activeWorkspaceId);

  useEffect(() => {
    const linkedin = searchParams.get("linkedin");
    if (!linkedin || handledRef.current) return;

    handledRef.current = true;

    if (linkedin === "connected") {
      showToast("LinkedIn connected", "link");
      invalidateLinkedIn();
      clearLinkedInConnectSession();
      sessionStorage.setItem("linkedin_show_import_prompt", "1");
    } else if (linkedin === "error") {
      clearLinkedInConnectSession();
      showToast(
        searchParams.get("message") ?? "Could not connect LinkedIn",
        "link_off",
      );
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("linkedin");
    url.searchParams.delete("message");
    url.searchParams.delete("workspaceId");
    router.replace(url.pathname + url.search);
  }, [invalidateLinkedIn, router, searchParams, showToast]);

  useEffect(() => {
    if (sessionStorage.getItem("linkedin_show_import_prompt") !== "1") return;
    if (!linkedInProfile) return;
    if (!needsLinkedInProfileImport(linkedInProfile)) {
      sessionStorage.removeItem("linkedin_show_import_prompt");
      return;
    }

    sessionStorage.removeItem("linkedin_show_import_prompt");
    showToast(
      "Import your full profile in Settings for headline, About, and experience",
      "info",
    );
  }, [linkedInProfile, showToast]);

  return null;
}
