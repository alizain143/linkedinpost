"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/api/use-auth-api";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { requestFcmToken } from "@/lib/firebase/messaging";
import { revokeCurrentPushToken } from "@/lib/push-token-lifecycle";
import {
  clearPersistedFcmToken,
} from "@/lib/push-token-storage";
import { usePpToast } from "@/providers/pp-toast-provider";

const PUSH_PROMPT_KEY = "pp_push_prompt_dismissed";

export function usePushNotifications() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { data: user } = useCurrentUser();
  const updateUser = useUpdateCurrentUser();
  const { showToast } = usePpToast();
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPromptDismissed(Boolean(sessionStorage.getItem(PUSH_PROMPT_KEY)));
    }
  }, []);

  const enablePush = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      showToast("Push notifications are not configured yet.", "error");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    await updateUser.mutateAsync({
      notifications: { pushEnabled: true },
    });

    // PushNotificationsRuntime picks up the new pref and registers the token.
    await requestFcmToken();
    return true;
  }, [showToast, updateUser]);

  const disablePush = useCallback(async () => {
    await revokeCurrentPushToken(() => getToken());
    clearPersistedFcmToken();

    await updateUser.mutateAsync({
      notifications: { pushEnabled: false },
    });
  }, [getToken, updateUser]);

  const shouldShowPrompt =
    isLoaded &&
    isSignedIn &&
    isFirebaseConfigured() &&
    user?.notifications.pushEnabled !== false &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "default" &&
    !promptDismissed;

  const dismissPrompt = useCallback(() => {
    sessionStorage.setItem(PUSH_PROMPT_KEY, "1");
    setPromptDismissed(true);
  }, []);

  return {
    enablePush,
    disablePush,
    shouldShowPrompt,
    dismissPrompt,
    isConfigured: isFirebaseConfigured(),
    permission:
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "default",
  };
}
