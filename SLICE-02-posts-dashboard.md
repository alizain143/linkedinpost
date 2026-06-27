# Slice 02 — Posts, Drafts & Dashboard Stats

**Status:** Complete  
**Phase:** Phase 1 completion

## Goal

Add `PostPackage` + `PostVersion` models, workspace-scoped draft CRUD with version history, and dashboard aggregations. Unblocks Drafts, Dashboard, and Post Package detail UI (backend only).

## Dependencies

- Slice 01: `Workspace`, `ContentProfile`, `WorkspacesService.assertMember`

## Prisma

- Enums: `PostPackageStatus`, `PostSource`, `PostType`
- Models: `PostPackage`, `PostVersion`
- Migration: `20250627200000_add_post_package_and_versions`

## API

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/posts` |
| `POST` | `/v1/workspaces/:workspaceId/posts` |
| `GET` | `/v1/workspaces/:workspaceId/posts/:id` |
| `PATCH` | `/v1/workspaces/:workspaceId/posts/:id` |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:id` |
| `GET` | `/v1/workspaces/:workspaceId/posts/:id/versions` |
| `GET` | `/v1/workspaces/:workspaceId/dashboard/stats` |

## Service rules

- Create/update only when `status === draft` (PATCH/DELETE)
- Version snapshot on create (v1) and on content field changes (`hook`, `body`, `cta`, `tags`)
- `contentProfileId` must belong to same workspace
- Credits: stub `used=0`, limit from `User.plan`

## Progress

- [x] Prisma schema + migration
- [x] Posts module (service, mapper, DTOs, controller)
- [x] Dashboard module
- [x] Swagger response DTOs
- [x] AppModule wiring
- [x] PRODUCT_OVERVIEW checkboxes

## Out of scope

- Status transitions, scheduling, publish, AI generation, PostMedia, credits ledger, frontend

## Test plan

```bash
POST /v1/workspaces/$WS/posts -d '{"hook":"Test hook","body":"Body text"}'
GET /v1/workspaces/$WS/posts?status=draft
PATCH /v1/workspaces/$WS/posts/$ID -d '{"body":"Updated body"}'
GET /v1/workspaces/$WS/posts/$ID/versions
GET /v1/workspaces/$WS/dashboard/stats
```
