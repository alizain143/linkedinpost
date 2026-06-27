# Slice 20 — Approval share links (backend)

**Status:** Complete  
**Phase:** Phase 6 — Business

## One outcome

Agency-plan users generate a single-use approval share link for posts in `ready_for_approval`. Clients open the link without an account, preview the post (with media), and approve or request changes. The token is revoked after one use.

## Dependencies

- Slice 05: approval actions, `ready_for_approval` transitions
- Slice 13/16: post media URLs for preview
- Slice 18: `PlanFeatureService`, Agency plan
- Slice 19: client workspaces (typical use case)

## Prisma

Migration `add_approval_tokens`:

- `ApprovalToken` model with `tokenHash`, `expiresAt`, `revokedAt`, `usedAt`, `createdById`
- Raw token never stored — only SHA-256 hash

## Plan enforcement

| Feature | Allowed plans |
|---------|---------------|
| `approval_share_links` | Agency only |

Link generation returns `403 PLAN_UPGRADE_REQUIRED` for non-agency users. Public actions require token possession only.

## Config

| Env | Default | Purpose |
|-----|---------|---------|
| `APPROVAL_LINK_EXPIRY_DAYS` | 14 | Token lifetime |
| `FRONTEND_URL` | `http://localhost:3000` | Share link base URL |

Share URL format: `${FRONTEND_URL}/approve/${rawToken}`

## API — Authenticated (Clerk)

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/v1/workspaces/:workspaceId/posts/:postId/approval-link` | Create link → `{ url, expiresAt }` |
| `GET` | `/v1/workspaces/:workspaceId/posts/:postId/approval-link` | Active link metadata (no raw token) |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:postId/approval-link` | Manual revoke |

Create requires post status `ready_for_approval`. One active token per post — creating a new link revokes prior active tokens.

## API — Public (no auth)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/v1/public/approval/:token` | Preview post for review |
| `POST` | `/v1/public/approval/:token/approve` | Approve |
| `POST` | `/v1/public/approval/:token/request-changes` | `{ "feedback": "..." }` |
| `POST` | `/v1/public/approval/:token/reject` | `{ "feedback?": "..." }` |

Preview omits internal fields (workspace ID, scores, council IDs, prior approval feedback). Includes workspace name and media URLs.

Action responses: `{ id, status }`. Single-use: `usedAt` set after successful action.

## Error codes

| Code | When |
|------|------|
| `PLAN_UPGRADE_REQUIRED` | Non-agency user creates link |
| `POST_NOT_AWAITING_APPROVAL` | Post not `ready_for_approval` on create |
| `APPROVAL_LINK_INVALID` | Missing, expired, revoked, or used token |
| `APPROVAL_ALREADY_RESOLVED` | Post no longer `ready_for_approval` on public call |
| `INVALID_STATUS_TRANSITION` | Invalid transition (existing) |
| `VALIDATION_ERROR` | Missing feedback on request-changes |

## Service layering

- `ApprovalShareService` — token CRUD, hash/verify, resolve
- `PostsService.applyApprovalAction` — shared transition logic without member check
- `public-approval.mapper.ts` — preview DTO

## Out of scope

- Frontend `/approve/:token` page
- Email delivery of links
- Password/PIN on top of token
- Rate limiting middleware

## Test plan

```bash
cd apps/backend && npm test && npm run build
```

Manual:

1. Set user to `agency` plan
2. Move post to `ready_for_approval`
3. `POST .../approval-link` → copy `url`
4. `GET /v1/public/approval/:token` (no auth) → preview with media
5. `POST .../approve` → post `approved`; second call → `404`
6. Pro user `POST .../approval-link` → `403`

## Progress

- [x] `ApprovalToken` migration + Prisma relation
- [x] Agency-only link create; one active token per post
- [x] Public preview + approve / request-changes / reject
- [x] Single-use token revocation after action
- [x] Reuses existing post status transitions
- [x] Tests pass; `nest build` succeeds
