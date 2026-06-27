# Slice 05 — Approvals Queue

**Status:** Complete  
**Phase:** Phase 2 — Workflow (no AI)

## Goal

Approvals review queue (mine / client / changes / approved tabs) plus semantic approve, request-changes, and reject actions.

## Dependencies

- Slice 02: `PostPackage`
- Slice 03: status transitions

## Prisma

- `submittedForApprovalAt`, `approvalFeedback` on `PostPackage`
- Migration: `20250627220000_add_post_package_approval_fields`

## API

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/approvals` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/approve` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/request-changes` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/reject` |

### Queue query

| Param | Type | Default |
|-------|------|---------|
| `tab` | `mine` \| `client` \| `changes` \| `approved` | `mine` |
| `limit` | int | 20 (max 50) |
| `offset` | int | 0 |

Response includes `counts` for all tabs on every request.

## Progress

- [x] Prisma migration
- [x] approvals.constants + tests
- [x] PostsService approval actions
- [x] ApprovalsService + controller + Swagger
- [x] POST action routes on PostsController
- [x] PRODUCT_OVERVIEW checkboxes

## Out of scope

Approval share links (see [SLICE-20](SLICE-20-approval-share-links.md)), credits middleware, frontend, new `rejected` status

## Test plan

```bash
GET /v1/workspaces/$WS/approvals?tab=mine
POST /v1/workspaces/$WS/posts/$ID/approve
POST /v1/workspaces/$WS/posts/$ID/request-changes -d '{"feedback":"..."}'
```

Unit tests: `approvals.constants.spec.ts`, `approvals.service.spec.ts`, extended `posts.service.spec.ts`
