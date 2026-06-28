# FE-Slice 08 — Approvals queue

**Status:** Complete  
**Depends on:** FE-SLICE-06

## Goal

Wire `/app/approvals` to workspace-scoped approval queue with four tabs and real approve / request-changes / reject actions.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/approvals` |
| `POST` | `.../posts/:postId/approve` |
| `POST` | `.../posts/:postId/request-changes` |
| `POST` | `.../posts/:postId/reject` |

Maps to backend SLICE-05.

## Delivered

### API layer

- [`lib/api/types/approvals.ts`](apps/web/src/lib/api/types/approvals.ts)
- [`lib/api/approvals.ts`](apps/web/src/lib/api/approvals.ts) — `fetchApprovals`
- [`lib/approval-tabs.ts`](apps/web/src/lib/approval-tabs.ts) — tab config + action visibility
- [`lib/approval-utils.ts`](apps/web/src/lib/approval-utils.ts) — score, metadata, preview helpers
- [`lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `approvals.queue`

### Hooks

- [`use-approvals-api.ts`](apps/web/src/hooks/api/use-approvals-api.ts) — `useApprovals`, `useInvalidateApprovals`
- [`use-posts-api.ts`](apps/web/src/hooks/api/use-posts-api.ts) — list mutations + approvals invalidation

### Approvals page

- [`Approvals.tsx`](apps/web/src/components/sections/app/approvals/Approvals.tsx) — API tabs, QueryState, card actions, local request-changes modal
- [`request-changes-modal.tsx`](apps/web/src/components/modals/request-changes-modal.tsx) — controlled feedback form
- [`app-ui-provider.tsx`](apps/web/src/providers/app-ui-provider.tsx) — `confirmRejectPost(title, onConfirm)`

## Behaviors

- Tabs: mine, client, changes, approved with API `counts` badges
- URL sync: `?tab=mine|client|changes|approved`
- Approve / reject / request-changes invalidate approvals, pipeline, dashboard, posts
- Copy link removed (FE-SLICE-18)
- Schedule button disabled on approved tab until FE-SLICE-11

## Progress

- [x] Approvals types + fetch
- [x] Query + list mutations
- [x] Modals + confirm wiring
- [x] Approvals UI
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Mine tab loads ready-for-approval posts
- [ ] Tab badges match API counts
- [ ] Approve moves post to approved tab
- [ ] Request changes shows feedback on changes tab
- [ ] Reject removes from queue
- [ ] Review opens post detail
- [ ] Pipeline + dashboard refresh after actions
- [ ] Loading/error states work

## Out of scope

- Share links (FE-SLICE-18)
- Schedule modal (FE-SLICE-11)
