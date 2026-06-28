# FE-Slice 09 — Calendar views

**Status:** Complete  
**Depends on:** FE-SLICE-06

## Goal

Wire `/app/calendar` to workspace-scoped calendar API for month, week, and list views with status filters, timezone-aware bucketing, and links to post detail.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/calendar` |

Query params: `view` (`month` \| `week` \| `list`), `date` (`YYYY-MM-DD`), `status` (comma-separated), `limit` (list only).

Maps to backend SLICE-04.

## Delivered

### API layer

- [`lib/api/types/calendar.ts`](apps/web/src/lib/api/types/calendar.ts)
- [`lib/api/calendar.ts`](apps/web/src/lib/api/calendar.ts) — `fetchCalendar`
- [`lib/calendar-filters.ts`](apps/web/src/lib/calendar-filters.ts) — filter pills → status query
- [`lib/calendar-utils.ts`](apps/web/src/lib/calendar-utils.ts) — anchor navigation, formatting helpers
- [`lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `calendar.events`
- [`lib/post-status.ts`](apps/web/src/lib/post-status.ts) — `CALENDAR_LEGEND_STATUSES`

### Hooks

- [`use-calendar-api.ts`](apps/web/src/hooks/api/use-calendar-api.ts) — `useCalendar`, `useInvalidateCalendar`
- [`use-posts-api.ts`](apps/web/src/hooks/api/use-posts-api.ts) — calendar invalidation on post mutations

### Calendar page

- [`Calendar.tsx`](apps/web/src/components/sections/app/calendar/Calendar.tsx) — API month/week/list, filters, navigation, QueryState
- [`CalendarEventChip.tsx`](apps/web/src/components/sections/app/calendar/CalendarEventChip.tsx) — linked event chips
- [`app/app/calendar/page.tsx`](apps/web/src/app/app/calendar/page.tsx) — `Suspense` for URL params

## Behaviors

- Month grid and week columns from API (`cells` / `days`); list from `items`
- Filters: All, Needs Approval, Scheduled, Published, Failed (no Autopilot/Manual — API has no `source`)
- URL sync: `?view=month&date=2026-06-15&filter=All`
- Prev/next: ±1 month (month view) or ±7 days (week/list)
- Today button resets anchor to user timezone
- Timezone label from API response (user DB timezone)
- Event click → `/app/posts/:id`
- Post mutations invalidate calendar queries

## Progress

- [x] Calendar types + fetch + filters/utils
- [x] Query hook + invalidation
- [x] Calendar UI rewrite
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Month view loads events for active workspace
- [ ] Prev/next month refetches with new `date`
- [ ] Week view shows 7 days from API
- [ ] List view shows items in list range
- [ ] Filter pills change `status` query
- [ ] Published posts appear on published date
- [ ] Event click opens post detail
- [ ] `isToday` highlights correct cell
- [ ] Switch workspace → calendar refetches
- [ ] Loading skeleton + error retry
- [ ] Timezone change in Settings → subsequent requests bucket correctly

## Out of scope

- Bulk calendar generation UI (FE-SLICE-14)
- Schedule/reschedule actions (FE-SLICE-11)
