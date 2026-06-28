"use client";

import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { getFirebaseApp, isFirebaseConfigured } from "./client";

let messagingPromise: ReturnType<typeof getMessaging> | null = null;

async function getMessagingInstance() {
  if (!isFirebaseConfigured()) return null;
  const supported = await isSupported();
  if (!supported) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  if (!messagingPromise) {
    messagingPromise = getMessaging(app);
  }

  return messagingPromise;
}

export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  }

  return getToken(messaging, { vapidKey });
}

export async function subscribeToForegroundMessages(
  handler: (payload: { title?: string; body?: string; actionUrl?: string }) => void,
) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    handler({
      title: payload.notification?.title,
      body: payload.notification?.body,
      actionUrl: payload.data?.actionUrl,
    });
  });
}
