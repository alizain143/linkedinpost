# FE-SLICE-20 — Notifications inbox + integration polish

**Status:** Complete  
**Depends on:** FE-SLICE-19

## Goal

Full notifications inbox at `/app/notifications`, cross-feature query invalidation, logout push token cleanup, and shared notification utilities.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/notifications` (`?limit`, `cursor`, `unreadOnly`) |
| `GET` | `/v1/notifications/unread-count` |
| `PATCH` | `/v1/notifications/:id/read` |
| `POST` | `/v1/notifications/read-all` |
| `DELETE` | `/v1/notifications/devices/:token` |

## Delivered

### Utilities

- [`lib/notification-utils.ts`](apps/web/src/lib/notification-utils.ts) — icons, relative time, safe action paths
- [`lib/notification-query-invalidation.ts`](apps/web/src/lib/notification-query-invalidation.ts)
- [`lib/push-token-lifecycle.ts`](apps/web/src/lib/push-token-lifecycle.ts) — shared logout/disable revoke

### Hooks

- [`use-notifications-api.ts`](apps/web/src/hooks/api/use-notifications-api.ts) — `useNotificationsInfinite`, `useInvalidateNotifications`, optimistic unread count

### Inbox page

- [`/app/notifications`](apps/web/src/app/app/notifications/page.tsx)
- [`components/sections/app/notifications/`](apps/web/src/components/sections/app/notifications/) — filter tabs, load more, mark all read

### Integration

- Topbar refetch on open, type icons, **View all notifications** link
- Invalidation from generation job completion, approve/reject/request-changes, schedule/publish
- Logout revokes FCM token (best-effort)

## Progress

- [x] Notification utils + Vitest
- [x] Infinite query + invalidation helper
- [x] Cross-hook invalidation
- [x] Inbox page
- [x] Topbar polish
- [x] Logout push revoke
- [x] `.env.example` + docs

## Manual test plan

- [ ] Complete generation → badge updates after job screen invalidation
- [ ] Topbar dropdown refetches on open; **View all** opens inbox
- [ ] Unread filter + mark all read
- [ ] Load more with 20+ notifications
- [ ] Row click navigates safely
- [ ] Logout revokes push device token
