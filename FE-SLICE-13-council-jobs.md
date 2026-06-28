# FE-Slice 13 — Council generate + job polling

**Status:** Complete  
**Depends on:** FE-SLICE-12

## Goal

Enable AI Council mode on the Generate page with async job enqueue, live polling, progress timeline, and navigation to the created post on success.

## Backend APIs

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/generate/council` |
| `GET` | `/v1/jobs/:id` |
| `GET` | `/v1/workspaces/:workspaceId/posts/:postId/council` |

Maps to backend SLICE-09 and SLICE-10.

## Delivered

### API layer

- Extended [`lib/api/types/generation.ts`](apps/web/src/lib/api/types/generation.ts) — council events, progress, job result union
- [`lib/api/types/council.ts`](apps/web/src/lib/api/types/council.ts) — council timeline types
- [`lib/api/generation.ts`](apps/web/src/lib/api/generation.ts) — `generateCouncil`, `fetchGenerationJob`
- [`lib/api/council.ts`](apps/web/src/lib/api/council.ts) — `fetchCouncilHistory`
- [`lib/council-utils.ts`](apps/web/src/lib/council-utils.ts) — role labels, duration formatting, poll helpers

### Hooks

- [`use-generation-api.ts`](apps/web/src/hooks/api/use-generation-api.ts) — `useCouncilMutation`, `useGenerationJob` (2.5s polling)
- [`use-council-api.ts`](apps/web/src/hooks/api/use-council-api.ts) — `useCouncilHistory`

### UI

- [`CouncilTimeline.tsx`](apps/web/src/components/sections/app/generate/CouncilTimeline.tsx) — progress bar + agent event rows
- [`Generate.tsx`](apps/web/src/components/sections/app/generate/Generate.tsx) — council mode enabled, brief field, live timeline, navigate on complete
- [`PostDetail.tsx`](apps/web/src/components/sections/app/posts/PostDetail.tsx) — read-only council history (latest run)

## Behaviors

- Council mode enqueues async job (3 credits); polls until `completed` or `failed`
- Progress bar + `events[]` timeline with agent role, label, duration
- On success: invalidate credits/posts/council queries; navigate to `/app/posts/:postPackageId`
- `REDIS_UNAVAILABLE`, `CREDITS_EXHAUSTED`, and council error codes surfaced via `getApiErrorMessage`
- Post + Media tab remains disabled
- Quick draft mode unchanged

## Progress

- [x] Council types + fetch + utils
- [x] Mutations + polling + history hooks
- [x] CouncilTimeline component
- [x] Generate + PostDetail wiring
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Council submit returns job; timeline updates while running
- [ ] Progress bar and active step label update
- [ ] Complete navigates to post detail with content/score/media
- [ ] Failed job shows error + timeline; retry works
- [ ] Post detail shows council history for council-generated posts
- [ ] `REDIS_UNAVAILABLE` handled on enqueue
- [ ] Quick draft still works

## Out of scope

- Media regen UI
- Post + Media tab (10-credit mode)
- Bulk calendar (FE-SLICE-14)
