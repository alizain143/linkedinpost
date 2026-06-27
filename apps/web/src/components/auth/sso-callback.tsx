"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { syncCurrentUser } from "@/lib/auth/finish-session";

export function SsoCallback() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || syncedRef.current) return;

    syncedRef.current = true;
    void syncCurrentUser(getToken, queryClient).catch(() => {
      syncedRef.current = false;
    });
  }, [getToken, isLoaded, isSignedIn, queryClient]);

  return <AuthenticateWithRedirectCallback />;
}
