# FE-Slice 07 — Pipeline kanban

**Status:** Complete  
**Depends on:** FE-SLICE-06

## Goal

Wire `/app/pipeline` to workspace-scoped pipeline kanban: 10 status columns from the API, clickable cards to post detail, flattened table view, and overflow hints when columns are truncated.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/pipeline` |

Query: `limitPerColumn` (default 20, max 50)

Maps to backend SLICE-03.

## Delivered

### API layer

- [`lib/api/types/pipeline.ts`](apps/web/src/lib/api/types/pipeline.ts) — column + summary types
- [`lib/api/pipeline.ts`](apps/web/src/lib/api/pipeline.ts) — `fetchPipeline`
- [`lib/pipeline-utils.ts`](apps/web/src/lib/pipeline-utils.ts) — flatten, overflow, card formatting
- [`lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `pipeline.board`

### Hooks

- [`use-pipeline-api.ts`](apps/web/src/hooks/api/use-pipeline-api.ts) — `usePipeline`, `useInvalidatePipeline`
- [`use-posts-api.ts`](apps/web/src/hooks/api/use-posts-api.ts) — pipeline invalidation on post mutations

### Pipeline page

- [`Pipeline.tsx`](apps/web/src/components/sections/app/pipeline/Pipeline.tsx)
- Kanban columns from API (10 statuses)
- Cards link to `/app/posts/:id`
- Overflow hint when `count > posts.length`
- Bottom table from flattened column posts
- `QueryState` loading skeleton + error retry

## Behaviors

- Pipeline refetches when active workspace changes
- Post create/update/delete/status transition invalidates pipeline
- No drag-and-drop (out of scope)

## Progress

- [x] Pipeline types + fetch
- [x] TanStack Query hook + invalidation
- [x] Kanban + table UI
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Pipeline loads columns for active workspace
- [ ] Switch workspace → pipeline refetches
- [ ] Column headers/counts match API
- [ ] Card click opens post detail
- [ ] Bottom table shows loaded posts
- [ ] Overflow hint when column truncated
- [ ] Loading skeleton + retry on error
- [ ] Post mutations refresh pipeline

## Out of scope

- Drag-and-drop status change
- Per-column pagination fetch
- Approvals queue UI (FE-SLICE-08)
