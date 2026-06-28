"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/api/use-auth-api";
import {
  useRegisterPushDevice,
} from "@/hooks/api/use-notifications-api";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  requestFcmToken,
  subscribeToForegroundMessages,
} from "@/lib/firebase/messaging";
import { revokeCurrentPushToken } from "@/lib/push-token-lifecycle";

const PUSH_PROMPT_KEY = "pp_push_prompt_dismissed";

export function usePushNotifications() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { data: user } = useCurrentUser();
  const registerDevice = useRegisterPushDevice();
  const updateUser = useUpdateCurrentUser();
  const queryClient = useQueryClient();
  const registeredTokenRef = useRef<string | null>(null);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPromptDismissed(Boolean(sessionStorage.getItem(PUSH_PROMPT_KEY)));
    }
  }, []);

  const syncToken = useCallback(async () => {
    if (!isFirebaseConfigured() || !user?.notifications.pushEnabled) {
      return null;
    }

    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return null;
    }

    const token = await requestFcmToken();
    if (!token) return null;

    if (registeredTokenRef.current !== token) {
      await registerDevice.mutateAsync(token);
      registeredTokenRef.current = token;
    }

    return token;
  }, [registerDevice, user?.notifications.pushEnabled]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.notifications.pushEnabled) {
      return;
    }

    void syncToken();
  }, [isLoaded, isSignedIn, syncToken, user?.notifications.pushEnabled]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let unsubscribe = () => {};

    void subscribeToForegroundMessages((payload) => {
      const title = payload.title ?? "New notification";
      const body = payload.body ?? "";
      toast(title, { description: body });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }).then((off) => {
      unsubscribe = off;
    });

    return () => unsubscribe();
  }, [isLoaded, isSignedIn, queryClient]);

  const enablePush = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      toast.error("Push notifications are not configured yet.");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    await updateUser.mutateAsync({
      notifications: { pushEnabled: true },
    });

    await syncToken();
    return true;
  }, [syncToken, updateUser]);

  const disablePush = useCallback(async () => {
    await revokeCurrentPushToken(() => getToken());
    registeredTokenRef.current = null;

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
