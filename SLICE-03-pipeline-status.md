# Slice 03 — Post Status Transitions & Pipeline View

**Status:** Complete  
**Phase:** Phase 2 — Workflow (no AI)

## Goal

Add validated manual post status transitions and a read-only pipeline kanban endpoint. Posts can move through the approval/scheduling workflow; pipeline UI can render columns by stage.

## Dependencies

- Slice 02: `PostPackage`, `PostsService`, workspace guards

## Prisma

No migration — uses existing `status`, `scheduledAt`, `publishedAt`.

## API

| Method | Route |
|--------|-------|
| `PATCH` | `/v1/workspaces/:workspaceId/posts/:id/status` |
| `GET` | `/v1/workspaces/:workspaceId/pipeline` |

## Manual transitions (v1)

- `draft` → `ready_for_approval`
- `ready_for_approval` → `approved`, `draft`
- `approved` → `scheduled` (requires `scheduledAt`)
- `scheduled` → `draft`, `publishing`
- `publishing` → `published`, `failed`
- `failed` → `draft`, `scheduled`

Content PATCH/DELETE still only when `status === draft`.

## Progress

- [x] `post-status.transitions.ts` + DTO
- [x] `PATCH .../posts/:id/status`
- [x] `GET .../pipeline`
- [x] Swagger
- [x] PRODUCT_OVERVIEW checkboxes

## Out of scope

Calendar, approvals queue, credits ledger, AI stages, LinkedIn publish, frontend

## Test plan

```bash
PATCH /v1/workspaces/$WS/posts/$ID/status -d '{"status":"ready_for_approval"}'
PATCH ... -d '{"status":"approved"}'
PATCH ... -d '{"status":"scheduled","scheduledAt":"2026-07-15T14:00:00.000Z"}'
GET /v1/workspaces/$WS/pipeline
```
