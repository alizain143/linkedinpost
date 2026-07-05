"use client";

import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  register,
} from "firebase/messaging";
import { getFirebaseApp, isFirebaseConfigured } from "./client";

let messagingPromise: ReturnType<typeof getMessaging> | null = null;
let tokenRequestPromise: Promise<string | null> | null = null;

const FCM_SW_PATH = "/firebase-messaging-sw.js";

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

async function getFcmServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.register(FCM_SW_PATH);
  await registration.update().catch(() => {});
  return navigator.serviceWorker.ready;
}

export async function requestFcmToken(): Promise<string | null> {
  if (tokenRequestPromise) return tokenRequestPromise;

  tokenRequestPromise = (async () => {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return null;

    const serviceWorkerRegistration = await getFcmServiceWorkerRegistration();
    if (!serviceWorkerRegistration) return null;

    return new Promise<string>((resolve, reject) => {
      const unsubscribe = onRegistered(messaging, (fid) => {
        unsubscribe();
        resolve(fid);
      });

      void register(messaging, { vapidKey, serviceWorkerRegistration }).catch(
        (error: unknown) => {
          unsubscribe();
          reject(error);
        },
      );
    });
  })();

  try {
    return await tokenRequestPromise;
  } finally {
    tokenRequestPromise = null;
  }
}

export async function subscribeToForegroundMessages(
  handler: (payload: { title?: string; body?: string; actionUrl?: string }) => void,
) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    handler({
      title: payload.notification?.title ?? payload.data?.title,
      body: payload.notification?.body ?? payload.data?.body,
      actionUrl: payload.data?.actionUrl,
    });
  });
}
