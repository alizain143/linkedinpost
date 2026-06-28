"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  findLinkedInExternalAccount,
  LINKEDIN_CONNECT_COMPLETE,
} from "@/lib/auth/linkedin-clerk";

const LINKEDIN_CONNECT_SUCCESS = `${LINKEDIN_CONNECT_COMPLETE}?linkedin=connected`;

function hasSignInOAuthCallbackParams(search: string) {
  return (
    search.includes("__clerk") ||
    search.includes("rotating_token") ||
    /[?&]code=/.test(search)
  );
}

export function LinkedInConnectCallback() {
  const clerk = useClerk();
  const { isLoaded: userLoaded, user } = useUser();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!clerk.loaded || !userLoaded || handledRef.current) return;

    handledRef.current = true;

    const finishExternalAccountLink = async () => {
      await user?.reload();
      const connected = Boolean(findLinkedInExternalAccount(user));

      router.replace(
        connected
          ? LINKEDIN_CONNECT_SUCCESS
          : `${LINKEDIN_CONNECT_COMPLETE}?linkedin=error`,
      );
    };

    const search =
      typeof window !== "undefined" ? window.location.search : "";

    if (hasSignInOAuthCallbackParams(search)) {
      void clerk
        .handleRedirectCallback(
          {
            signInForceRedirectUrl: LINKEDIN_CONNECT_SUCCESS,
            signUpForceRedirectUrl: LINKEDIN_CONNECT_SUCCESS,
            signInFallbackRedirectUrl: LINKEDIN_CONNECT_SUCCESS,
            signUpFallbackRedirectUrl: LINKEDIN_CONNECT_SUCCESS,
          },
          (to) => {
            router.replace(to);
            return Promise.resolve();
          },
        )
        .catch(() => {
          void finishExternalAccountLink();
        });
      return;
    }

    void finishExternalAccountLink().catch(() => {
      handledRef.current = false;
      router.replace(`${LINKEDIN_CONNECT_COMPLETE}?linkedin=error`);
    });
  }, [clerk, clerk.loaded, router, user, userLoaded]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#64748b]">
      Finishing LinkedIn connection…
    </div>
  );
}
