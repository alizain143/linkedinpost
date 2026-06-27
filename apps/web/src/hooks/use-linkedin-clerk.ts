"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import {
  getLinkedInProfileName,
  isLinkedInConnected,
  isLinkedInProvider,
} from "@/lib/auth/linkedin-clerk";

export function useLinkedInClerk() {
  const { isLoaded, user } = useUser();

  const externalAccount = useMemo(
    () =>
      user?.externalAccounts.find(
        (account) =>
          isLinkedInProvider(account.provider) &&
          account.verification?.status === "verified",
      ) ?? null,
    [user],
  );

  const connected = isLoaded && isLinkedInConnected(user);
  const profileName = useMemo(
    () => getLinkedInProfileName(user, externalAccount ?? undefined),
    [externalAccount, user],
  );

  return {
    isLoaded,
    connected,
    profileName,
    externalAccount,
    user,
  };
}
