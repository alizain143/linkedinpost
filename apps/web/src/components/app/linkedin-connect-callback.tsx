"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LINKEDIN_CONNECT_COMPLETE } from "@/lib/auth/linkedin-clerk";

export function LinkedInConnectCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || redirectedRef.current) return;

    redirectedRef.current = true;
    router.replace(`${LINKEDIN_CONNECT_COMPLETE}?linkedin=connected`);
  }, [isLoaded, isSignedIn, router]);

  return <AuthenticateWithRedirectCallback />;
}
