# FE-SLICE-19 — Notifications UI + web push

**Status:** Complete

## Scope

Wire topbar notifications dropdown, settings push toggle, Firebase FCM web push registration.

## API hooks

- `useNotifications`, `useUnreadNotificationCount` (30s poll)
- `useMarkNotificationRead`, `useMarkAllNotificationsRead`
- `useRegisterPushDevice`, `useRevokePushDevice`

## UI

| Area | File |
|------|------|
| Topbar dropdown + badge | `apps/web/src/components/app/app-topbar.tsx` |
| Push soft prompt | `apps/web/src/components/app/push-notification-prompt.tsx` |
| Settings email + push toggles | `apps/web/src/components/sections/app/settings/Settings.tsx` |
| FCM service worker route | `apps/web/src/app/firebase-messaging-sw.js/route.ts` |

## Env (frontend)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

## Checklist

- [x] Topbar lists notifications from API
- [x] Unread badge polls `/notifications/unread-count`
- [x] Click notification marks read + navigates
- [x] Settings email toggles include publish alerts
- [x] Browser push toggle + permission prompt
- [x] FCM token registered on grant
