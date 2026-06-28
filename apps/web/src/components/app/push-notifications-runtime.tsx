"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useRegisterPushDevice } from "@/hooks/api/use-notifications-api";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  requestFcmToken,
  subscribeToForegroundMessages,
} from "@/lib/firebase/messaging";
import {
  readPersistedFcmToken,
  writePersistedFcmToken,
} from "@/lib/push-token-storage";
import { usePpToast } from "@/providers/pp-toast-provider";

/** Registers FCM token + shows in-app toast when a push arrives while the tab is open. */
export function PushNotificationsRuntime() {
  const { isLoaded, isSignedIn } = useAuth();
  const { data: user } = useCurrentUser();
  const registerDevice = useRegisterPushDevice();
  const queryClient = useQueryClient();
  const { showNotificationToast } = usePpToast();
  const registeredTokenRef = useRef<string | null>(null);

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

    registeredTokenRef.current = token;

    // Already registered for this browser — Firebase returns the same token.
    if (readPersistedFcmToken() === token) {
      return token;
    }

    await registerDevice.mutateAsync(token);
    writePersistedFcmToken(token);
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
      showNotificationToast(title, body, payload.actionUrl);
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }).then((off) => {
      unsubscribe = off;
    });

    return () => unsubscribe();
  }, [isLoaded, isSignedIn, queryClient, showNotificationToast]);

  return null;
}
