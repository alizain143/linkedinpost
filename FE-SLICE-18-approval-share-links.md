# FE-Slice 18 — Approval share links

**Status:** Complete  
**Depends on:** FE-SLICE-08, FE-SLICE-16

## Goal

Wire approval share links for Agency users on post detail and a public `/approve/[token]` page for client review without signing in.

## Backend APIs

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/posts/:postId/approval-link` |
| `GET` | `/v1/workspaces/:workspaceId/posts/:postId/approval-link` |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:postId/approval-link` |
| `GET` | `/v1/public/approval/:token` |
| `POST` | `/v1/public/approval/:token/approve` |
| `POST` | `/v1/public/approval/:token/request-changes` |
| `POST` | `/v1/public/approval/:token/reject` |

Maps to backend SLICE-20.

## Delivered

### API layer

- [`lib/api/types/approval-share.ts`](apps/web/src/lib/api/types/approval-share.ts) — link + public preview types
- [`lib/api/approval-share.ts`](apps/web/src/lib/api/approval-share.ts) — authenticated create/status/revoke
- [`lib/api/public-approval.ts`](apps/web/src/lib/api/public-approval.ts) — public preview + actions
- [`lib/api/fetch.ts`](apps/web/src/lib/api/fetch.ts) — `publicApiFetch` (no Bearer token)
- [`lib/approval-share-utils.ts`](apps/web/src/lib/approval-share-utils.ts) — plan gate, expiry formatting, clipboard copy

### Hooks

- [`use-approval-share-api.ts`](apps/web/src/hooks/api/use-approval-share-api.ts) — status query + create/revoke mutations
- [`use-public-approval-api.ts`](apps/web/src/hooks/api/use-public-approval-api.ts) — public preview + action mutations
- [`query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `approvalShare.status`

### Authenticated UI

- [`ApprovalSharePanel.tsx`](apps/web/src/components/sections/app/posts/ApprovalSharePanel.tsx) — generate, copy, revoke, agency gate
- [`PostDetail.tsx`](apps/web/src/components/sections/app/posts/PostDetail.tsx) — panel when `ready_for_approval`

### Public UI

- [`PublicApprovalPage.tsx`](apps/web/src/components/sections/public/PublicApprovalPage.tsx) — preview, approve, request changes, reject
- [`app/approve/[token]/page.tsx`](apps/web/src/app/approve/[token]/page.tsx) — public route, `noindex`
- [`middleware.ts`](apps/web/src/middleware.ts) — `/approve(.*)` public

## Behaviors

- Agency-only plan gate via `canUseApprovalShareLinks(plan)`
- Share URL returned once on create; copy from session state; regenerate for fresh URL after refresh
- Active link metadata (expiry, created) from GET without raw token
- Public page uses no auth; invalid/expired/used links show error card
- Single-use token: success screen after client action
- `APPROVAL_LINK_INVALID`, `POST_NOT_AWAITING_APPROVAL` error messages

## Progress

- [x] Types + authenticated/public fetch + utils
- [x] Hooks + query keys
- [x] ApprovalSharePanel on post detail
- [x] Public approve page + middleware
- [x] Error messages + docs
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Share panel on `/app/posts/:id` when `ready_for_approval`
- [ ] Generate → copy URL → toast
- [ ] Refresh → active status without URL until regenerate
- [ ] Revoke clears active link
- [ ] Non-agency sees upgrade banner
- [ ] `/approve/:token` loads in incognito without auth redirect
- [ ] Approve / request changes / reject succeed once
- [ ] Used or revoked link shows error page

## Out of scope

- Email delivery of links
- Copy link on approvals queue cards
- Real-time agency UI refresh when client acts via public link
