# Slice 19 — Agency client workspaces (backend)

**Status:** Complete  
**Phase:** Phase 6 — Business

## One outcome

Agency-plan users can create, rename, and cascade soft-delete up to 5 client workspaces. Each client workspace gets a default content profile. Existing nested `/workspaces/:workspaceId/*` routes work via URL-based workspace switching.

## Dependencies

- Slice 01: `Workspace`, `WorkspaceMember`, `WorkspaceType.client`
- Slice 18: `PlanFeatureService`, Agency plan via XPay

## Prisma

Migration `add_workspace_cascade_soft_delete` adds `deletedAt` to:

- `Workspace`
- `ContentProfile`
- `PostPackage`
- `GenerationJob`
- `AutopilotConfig`

## Plan enforcement

| Feature | Allowed plans |
|---------|---------------|
| `client_workspaces` | Agency only |

Max **5** active (non-deleted) client workspaces per owner. Soft-deleted slots are reusable.

## API

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/v1/workspaces` | Create client workspace + default profile |
| `GET` | `/v1/workspaces/:workspaceId` | Workspace detail with stats |
| `PATCH` | `/v1/workspaces/:workspaceId` | Rename client workspace |
| `DELETE` | `/v1/workspaces/:workspaceId` | Cascade soft-delete |
| `GET` | `/v1/workspaces` | List workspaces (excludes deleted) |
| `GET` | `/v1/workspaces/current` | Personal workspace (unchanged) |

### Create body

```json
{
  "name": "Acme Corp",
  "profile": {
    "industry": "B2B SaaS",
    "targetAudience": "Early-stage founders"
  }
}
```

### Detail response stats

```json
{
  "stats": {
    "draftCount": 3,
    "scheduledCount": 2,
    "hasDefaultProfile": true
  }
}
```

## Cascade soft-delete

`DELETE` sets `deletedAt = now()` on workspace and all workspace-scoped content in one transaction. Nested rows (`PostVersion`, `PostMedia`, etc.) remain but are unreachable.

All workspace-scoped queries filter `deletedAt: null`.

## Error codes

| Code | When |
|------|------|
| `PLAN_UPGRADE_REQUIRED` | Non-agency user creates client workspace |
| `CLIENT_WORKSPACE_LIMIT` | 5 active client workspaces already |
| `VALIDATION_ERROR` | PATCH/DELETE on personal workspace |
| `WORKSPACE_FORBIDDEN` | Non-owner mutates client workspace |
| `RESOURCE_NOT_FOUND` | Soft-deleted or missing workspace |

## Manual test

1. Set user plan to `agency`
2. `POST /v1/workspaces` × 5 — succeed; 6th → `409`
3. Create posts in client workspace; `GET /v1/workspaces/:id` shows stats
4. `DELETE /v1/workspaces/:id` — hidden from lists; can create another client
5. Starter/Pro `POST /v1/workspaces` → `403`

## Progress

- [x] Cascade soft-delete migration
- [x] Agency-only create with 5-workspace limit
- [x] Default content profile on create
- [x] GET detail with stats; PATCH rename; DELETE cascade
- [x] Query filters across posts, profiles, jobs, autopilot, approvals
- [x] Tests + docs

## Out of scope

- Frontend Clients screen
- Workspace switch session / `POST /workspaces/:id/switch`
- Per-workspace LinkedIn
- Restore API
- Slice 20 approval share links
