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
CONTACT_TO_EMAIL=hello@linkedinpost.ai
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_VAPID_KEY=
```

Requires `REDIS_URL` for async delivery workers.

HTML emails use branded templates in `email-template.ts` (inline PNG logo — email clients block SVG; per-type accent colors and CTAs).

**Contact form:** `POST /v1/public/contact` (no auth) sends a raw Resend email to `CONTACT_TO_EMAIL` (default `hello@linkedinpost.ai`) with `replyTo` set to the submitter. Uses `ResendEmailSender.sendRaw` — not the notification queue.

**Push device tokens:** `POST /notifications/devices` keeps one active token per browser `userAgent` (revokes older tokens for the same UA) and caps active tokens at 5 per user. The web app persists the registered token in `localStorage` and skips re-registering when Firebase returns the same value.

## Weekly reminders

`WeeklyReminderJob` runs hourly and sends at Monday 09:00 in each user's `timezone`. Capped at 80 sends per run (Resend free-tier daily limit buffer).

## Idempotency

Use stable `dedupeKey` values per event (e.g. `generation_complete:{jobId}`). Publish events use `publish_succeeded:{postId}` — one success notification per post.
