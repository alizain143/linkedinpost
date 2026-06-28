# FE-Slice 11 — Schedule, reschedule, publish

**Status:** Complete  
**Depends on:** FE-SLICE-06, FE-SLICE-10

## Goal

Wire schedule/reschedule/cancel and publish-now actions to backend scheduling and LinkedIn publish APIs from post detail and the approvals approved tab.

## Backend APIs

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/schedule` |
| `PATCH` | `/v1/workspaces/:workspaceId/posts/:id/schedule` |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:id/schedule` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/publish` |

Maps to backend SLICE-11 and SLICE-12.

## Delivered

### API layer

- [`lib/api/types/scheduling.ts`](apps/web/src/lib/api/types/scheduling.ts)
- [`lib/schedule-utils.ts`](apps/web/src/lib/schedule-utils.ts) — timezone-aware form parsing + validation
- [`lib/api/posts.ts`](apps/web/src/lib/api/posts.ts) — `schedulePost`, `reschedulePost`, `cancelSchedule`, `publishPost`

### Hooks

- [`use-scheduling-api.ts`](apps/web/src/hooks/api/use-scheduling-api.ts) — schedule/reschedule/cancel/publish mutations
- [`use-posts-api.ts`](apps/web/src/hooks/api/use-posts-api.ts) — exported `invalidatePostQueries`

### UI

- [`schedule-modal.tsx`](apps/web/src/components/modals/schedule-modal.tsx) — editable date/time form
- [`app-ui-provider.tsx`](apps/web/src/providers/app-ui-provider.tsx) — post-aware `openSchedule`, `confirmPublishNow`
- [`PostDetail.tsx`](apps/web/src/components/sections/app/posts/PostDetail.tsx) — schedule/reschedule/cancel/publish actions
- [`Approvals.tsx`](apps/web/src/components/sections/app/approvals/Approvals.tsx) — enabled Schedule on approved tab
- [`app-shell-client.tsx`](apps/web/src/components/app/app-shell-client.tsx) — `WorkspaceProvider` wraps `AppUiProvider`

## Behaviors

- Schedule validation: 15 min lead, 90 day max (client + server)
- Publish returns updated post; failed publish shows `publishErrorMessage` without throwing
- `LINKEDIN_NOT_CONNECTED`, `LINKEDIN_SCOPE_MISSING`, `REDIS_UNAVAILABLE` surfaced via `getApiErrorMessage`
- Mutations invalidate posts, pipeline, approvals, calendar, dashboard
- Generate page `openSchedule()` without target shows "Save a post first" toast

## Progress

- [x] Scheduling types + fetch + utils
- [x] Mutations + error messages
- [x] ScheduleModal + AppUiProvider wiring
- [x] PostDetail + Approvals actions
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Approved post schedules and appears on calendar
- [ ] Scheduled post reschedules and cancels
- [ ] Publish now from approved/scheduled/failed
- [ ] Failed publish shows error message
- [ ] Approvals approved tab Schedule works
- [ ] LinkedIn/Redis errors handled gracefully
- [ ] Generate schedule shows save-first toast

## Out of scope

- Generate page real posts (FE-SLICE-12)
- Dedicated failed-publish retry UI beyond retry button
