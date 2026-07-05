# FE-Slice 14 — Bulk calendar generation

**Status:** Complete  
**Depends on:** FE-SLICE-13

## Goal

Add bulk calendar generation at `/app/generate/calendar`: form with **Text Only / AI Council** mode toggle, credit confirm modal, async job enqueue, progress polling, and navigation to calendar with Ready for Approval filter on complete.

## Backend APIs

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/generate/calendar` |
| `GET` | `/v1/jobs/:id` |

Maps to backend SLICE-14.

## Delivered

### API layer

- Extended [`lib/api/types/generation.ts`](apps/web/src/lib/api/types/generation.ts) — `CalendarJobResult`, `CalendarGenerateRequestBody`
- [`lib/api/generation.ts`](apps/web/src/lib/api/generation.ts) — `generateCalendar`
- [`lib/calendar-generation-utils.ts`](apps/web/src/lib/calendar-generation-utils.ts) — credit cost, plan gate, posting day defaults

### Hooks

- [`use-generation-api.ts`](apps/web/src/hooks/api/use-generation-api.ts) — `useCalendarGenerateMutation`; calendar job completion invalidates posts/calendar/dashboard

### UI

- [`CalendarJobProgress.tsx`](apps/web/src/components/sections/app/generate/CalendarJobProgress.tsx) — progress bar, failed state, completed slot summary
- [`CalendarGenerate.tsx`](apps/web/src/components/sections/app/generate/CalendarGenerate.tsx) + [`/app/generate/calendar`](apps/web/src/app/app/generate/calendar/page.tsx)
- CTAs wired from Dashboard, topbar, and Calendar page

## Behaviors

- **Generation mode toggle** at top: Text Only (1 credit/post) or AI Council (3 credits/post, includes image)
- **Credit confirm modal** with breakdown before starting (e.g. `30 posts × 3 credits = 90 credits`)
- 7-day and 30-day duration options with mode-aware credit totals
- 30-day gated to Pro/Agency client-side and via `PLAN_UPGRADE_REQUIRED`
- Form: content profile, optional start date, posting time, weekday pills, notes
- Polls job every 2.5s; on complete navigates to `/app/calendar?filter=Ready for Approval`
- Generated posts are `ready_for_approval` (visible via All and Ready for Approval filters)

## Progress

- [x] Calendar types + fetch + utils
- [x] Mutation + job polling invalidation
- [x] CalendarJobProgress + CalendarGenerate page
- [x] CTA wiring + error messages
- [x] `npm run build` passes

## Test plan (manual)

- [ ] 7-day text calendar: 7 credits; council: 21 credits
- [ ] On complete: posts in All and Ready for Approval calendar filters
- [ ] 30-day disabled on free/starter; works on pro
- [ ] `CREDITS_EXHAUSTED` and `REDIS_UNAVAILABLE` handled
- [ ] Dashboard/topbar/calendar CTAs open generate calendar page

## Out of scope

- Per-slot editing before approval
- Post + Media tab on Generate page
- Separate council job per slot (calendar runs council inline; single credit charge on parent job)
