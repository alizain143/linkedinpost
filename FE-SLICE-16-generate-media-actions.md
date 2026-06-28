# FE-Slice 16 — Generate media actions + Post + Media

**Status:** Complete  
**Depends on:** FE-SLICE-12, FE-SLICE-13, backend media job + premium council

## Goal

Wire per-variant actions on Quick Draft cards (Send to Review, Generate Media) and enable the Post + Media generation mode.

## Backend APIs

| Method | Route | Cost |
|--------|-------|------|
| `PATCH` | `/v1/workspaces/:workspaceId/posts/:id/status` | — |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/generate-media` | 5 credits |
| `POST` | `/v1/workspaces/:workspaceId/generate/council-premium` | 10 credits |

## Delivered

### Generate page (`Generate.tsx`)

- **Send to Review** — saves variant, transitions to `ready_for_approval`, navigates to post detail (no auto-approve)
- **Generate Media** — saves draft if needed, enqueues media job, polls progress, shows quote card preview on variant card
- **Post + Media tab** — enabled; calls `council-premium`; reuses `CouncilTimeline`
- AI Council copy updated to "reviewed + quote card"

### Post detail (`PostDetail.tsx`)

- **Generate quote card** button on drafts without media
- Polls while `media_generating`

### API / hooks

- `generatePostMedia`, `generateCouncilPremium`
- `useGeneratePostMediaMutation`, `usePremiumCouncilMutation`
- `MEDIA_GENERATION_CREDIT_COST` (5), `PREMIUM_COUNCIL_CREDIT_COST` (10)

## Test plan (manual)

- [ ] Send to Review creates post in Approvals without auto-approve
- [ ] Generate Media on variant deducts 5 credits and shows quote card preview
- [ ] Post + Media tab runs premium council at 10 credits with timeline
- [ ] Post detail Generate quote card works on saved draft
- [ ] `POST_ALREADY_HAS_MEDIA` surfaces when media exists
