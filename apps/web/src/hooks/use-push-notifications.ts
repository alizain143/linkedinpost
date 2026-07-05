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
  const [mounted, setMounted] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    setMounted(true);
    setPromptDismissed(Boolean(sessionStorage.getItem(PUSH_PROMPT_KEY)));
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enablePush = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      showToast("Push notifications are not configured yet.", "error");
      return false;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission !== "granted") {
      return false;
    }

    try {
      await updateUser.mutateAsync({
        notifications: { pushEnabled: true },
      });
    } catch {
      showToast("Could not save notification preference.", "error");
      return false;
    }

    // PushNotificationsRuntime registers the FCM token after pushEnabled flips.
    try {
      await requestFcmToken();
    } catch {
      showToast(
        "Browser permission granted, but push setup failed. Try again from Settings.",
        "error",
      );
      return false;
    }

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
    mounted &&
    isLoaded &&
    isSignedIn &&
    isFirebaseConfigured() &&
    user?.notifications.pushEnabled !== false &&
    permission === "default" &&
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
    permission,
  };
}
