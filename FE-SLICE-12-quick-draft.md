# FE-Slice 12 — Quick draft generate

**Status:** Complete  
**Depends on:** FE-SLICE-03, FE-SLICE-04

## Goal

Wire `/app/generate` quick draft mode to the backend quick draft API, display real variants, and save chosen variants as draft posts.

## Backend APIs

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/generate/quick` |
| `POST` | `/v1/workspaces/:workspaceId/posts` (save variant) |

Maps to backend SLICE-08.

## Delivered

### API layer

- [`lib/api/types/generation.ts`](apps/web/src/lib/api/types/generation.ts)
- [`lib/api/generation.ts`](apps/web/src/lib/api/generation.ts) — `generateQuickDraft`
- [`lib/generation-utils.ts`](apps/web/src/lib/generation-utils.ts) — word count, variant → `CreatePostBody`
- [`lib/post-types.ts`](apps/web/src/lib/post-types.ts) — `postTypeFromLabel` helper

### Hooks

- [`use-generation-api.ts`](apps/web/src/hooks/api/use-generation-api.ts) — `useQuickDraftMutation` with credits invalidation

### UI

- [`Generate.tsx`](apps/web/src/components/sections/app/generate/Generate.tsx) — real content profiles, quick draft form, variant cards, save/schedule/publish flows
- Council and Post + Media modes disabled with “Coming soon”

## Behaviors

- Quick draft defaults to **Quick Draft** mode (1 credit)
- Form uses workspace content profiles, optional pillar from profile, topic + notes
- Sync generation returns 3 variants from `job.result.variants`
- **Save Draft** creates post and navigates to post detail
- **Approve & Schedule** / **Approve & Post Now** save (if needed), auto-approve, then open schedule/publish modals
- `CREDITS_EXHAUSTED` surfaces billing link; credits invalidate after successful generation
- Empty content profiles prompt user to `/app/profile`

## Progress

- [x] Generation types + fetch + utils
- [x] Quick draft mutation hook
- [x] Generate page wired to API
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Quick draft with valid topic + profile returns 3 variants
- [ ] Credit balance decrements by 1 after success
- [ ] `CREDITS_EXHAUSTED` blocks generate and surfaces billing link
- [ ] Save Draft creates post visible in `/app/posts` and opens post detail
- [ ] Schedule / Publish from variant card works after auto-approve (LinkedIn connected)
- [ ] Regenerate produces new variants and charges another credit
- [ ] Council / media tabs are disabled with coming-soon messaging
- [ ] Empty content profiles shows create-profile prompt

## Out of scope

- Council async flow + job polling (FE-SLICE-13)
- Media generation on generate page
