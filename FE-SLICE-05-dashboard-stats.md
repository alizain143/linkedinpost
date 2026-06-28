# FE-Slice 05 — Dashboard Stats

**Status:** Complete  
**Depends on:** FE-SLICE-01, FE-SLICE-03, FE-SLICE-04

## Goal

Wire `/app/dashboard` to workspace-scoped dashboard stats: metric tiles, approval queue count, monthly credit usage card, and recent drafts list.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/dashboard/stats` |

Maps to backend SLICE-02 (`dashboard` module).

Also uses cached `GET /v1/credits` (FE-SLICE-04) for the credit usage card.

## Delivered

### API layer

- [`lib/api/types/dashboard.ts`](apps/web/src/lib/api/types/dashboard.ts) — full stats shape including `awaitingApproval`, `inProgress`
- [`lib/api/dashboard.ts`](apps/web/src/lib/api/dashboard.ts) — `fetchDashboardStats`
- [`lib/dashboard-metrics.ts`](apps/web/src/lib/dashboard-metrics.ts) — metric tile builder
- [`lib/post-types.ts`](apps/web/src/lib/post-types.ts) — `PostType` display labels
- [`lib/plan-labels.ts`](apps/web/src/lib/plan-labels.ts) — plan display labels
- [`lib/format-relative-time.ts`](apps/web/src/lib/format-relative-time.ts) — relative time + reset date formatting
- [`lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `dashboard.stats`

### Hooks

- [`use-dashboard-api.ts`](apps/web/src/hooks/api/use-dashboard-api.ts) — `useDashboardStats`, `useInvalidateDashboardStats`

### Dashboard page

- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx)
- Metric tiles from API + credits hook
- Approval queue count from `counts.awaitingApproval`
- Monthly credit usage from `useCredits()` (periodEnd, remaining)
- Recent drafts from API with empty state
- `QueryState` loading skeleton + error retry
- Upgrade promo hidden for paid plans
- Autopilot card remains mock (FE-SLICE-15)

## Behaviors

- Stats refetch when active workspace changes
- Draft rows link to `/app/pipeline` until FE-SLICE-06 post detail
- Generate One Post gating preserved from FE-SLICE-04

## Progress

- [x] Dashboard types + fetch
- [x] TanStack Query hook
- [x] Metric tiles + approval queue + credits card + drafts
- [x] Loading/error states
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Dashboard loads stats for active workspace
- [ ] Switch workspace → stats refetch
- [ ] Metric tiles match backend counts
- [ ] Approval queue shows `awaitingApproval`
- [ ] Credit usage card matches sidebar meter
- [ ] Recent drafts reflect API; empty state when none
- [ ] Loading skeleton + retry on error
- [ ] Generate gating still works
- [ ] Upgrade card only on free plan

## Out of scope

- Autopilot card API (FE-SLICE-15)
- Post detail links (FE-SLICE-06)
- Approvals/pipeline page wiring (FE-SLICE-07/08)
