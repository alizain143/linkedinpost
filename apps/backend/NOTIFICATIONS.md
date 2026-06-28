# Notifications module

User-scoped in-app notifications with async email (Resend) and web push (Firebase FCM).

## Flow

1. Domain code calls `NotificationEventService.emit*` after a successful DB commit.
2. Service creates `Notification` row (deduped by `dedupeKey`).
3. `NotificationDispatchService` enqueues `email` / `push` jobs based on user prefs and registered tokens.
4. `NotificationDeliveryProcessor` sends via Resend or FCM and updates `NotificationDelivery`.

## Prefs

| User field | API (`PATCH /auth/me`) | Channels |
|------------|------------------------|----------|
| `emailGenerationComplete` | `notifications.generationComplete` | Email for generation + ready-for-approval |
| `emailPublishAlerts` | `notifications.publishAlerts` | Email for publish success/fail |
| `emailWeeklyReminders` | `notifications.weeklyReminders` | Email for weekly cron |
| `emailProductUpdates` | `notifications.productUpdates` | Email for product broadcasts |
| `pushEnabled` | `notifications.pushEnabled` | FCM when device tokens exist |

Client approval actions always send email; in-app + push follow prefs.

## Config

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=notifications@yourdomain.com
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_VAPID_KEY=
```

Requires `REDIS_URL` for async delivery workers.

## Weekly reminders

`WeeklyReminderJob` runs hourly and sends at Monday 09:00 in each user's `timezone`. Capped at 80 sends per run (Resend free-tier daily limit buffer).

## Idempotency

Use stable `dedupeKey` values per event (e.g. `generation_complete:{jobId}`). Publish events use `publish_succeeded:{postId}` — one success notification per post.
