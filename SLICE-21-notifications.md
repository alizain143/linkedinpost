# Slice 21 — Notifications (in-app, email, web push)

**Status:** Complete

## Scope

End-to-end notifications: in-app feed, Resend transactional email, Firebase FCM web push.

## Schema

- `Notification`, `PushDeviceToken`, `NotificationDelivery`
- User prefs: `emailPublishAlerts`, `pushEnabled`

Migration: `20250708100000_add_notifications`

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/notifications` | User |
| GET | `/v1/notifications/unread-count` | User |
| PATCH | `/v1/notifications/:id/read` | User |
| POST | `/v1/notifications/read-all` | User |
| POST | `/v1/notifications/devices` | User |
| DELETE | `/v1/notifications/devices/:token` | User |

`PATCH /v1/auth/me` extended with `notifications.publishAlerts` and `notifications.pushEnabled`.

## Event triggers

| Event | Source module |
|-------|---------------|
| `generation_complete` | council/calendar/media job handlers |
| `post_ready_for_approval` | council orchestrator |
| `client_approved` / `client_requested_changes` | approval-share public actions |
| `publish_succeeded` / `publish_failed` | linkedin publish service |
| `weekly_content_reminder` | `WeeklyReminderJob` cron (Mon 9am user TZ) |

## Delivery

- BullMQ queue: `notification-delivery`
- Email: Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
- Push: Firebase Admin (`FIREBASE_*` env vars)

## Deep dive

[apps/backend/NOTIFICATIONS.md](apps/backend/NOTIFICATIONS.md)

## Manual test plan

1. Complete council job → in-app notification + email (if pref on)
2. Publish post → success/fail notification
3. Client approves via share link → creator notified
4. Toggle email pref off → no Resend delivery row `sent`
5. Register FCM token in browser → push on next event
6. Mark all read → unread count 0
