export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const firebaseVersion = "12.15.0";
  const script = `importScripts("https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();
const notificationIcon = new URL("/icons/app-icon-192.png", self.location.origin).href;
const notificationBadge = new URL("/icons/favicon-48.png", self.location.origin).href;
messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title || payload.data?.title || "linkedinpost.ai";
  const body = payload.notification?.body || payload.data?.body || "";
  const actionUrl = payload.data?.actionUrl || "/app";
  self.registration.showNotification(title, {
    body,
    icon: notificationIcon,
    badge: notificationBadge,
    data: { actionUrl },
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.actionUrl || "/app";
  const targetUrl = rawUrl.startsWith("http")
    ? rawUrl
    : new URL(rawUrl, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
