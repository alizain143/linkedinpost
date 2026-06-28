# linkedinpost.ai — Agent instructions

Monorepo: `apps/backend` (NestJS API), `apps/web` (Next.js — in progress).

## Documentation (read before backend/domain work)

| Doc | Purpose |
|-----|---------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Every table, field, enum — **start here for DB work** |
| [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) | Modules, flows, APIs, integrations as implemented |
| [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) | Product scope, slice tracker, route inventory |
| `SLICE-NN-*.md` | Per-feature implementation specs |
| `apps/backend/GENERATION.md`, `COUNCIL.md`, etc. | Module deep-dives |

**Schema source of truth:** `apps/backend/prisma/schema.prisma`

## Keep docs updated (required)

On every change that touches schema, backend modules, or shipped features, update docs in the **same change**:

1. **Prisma / migrations** → `DATABASE_SCHEMA.md` (+ `CURRENT_ARCHITECTURE.md` if architectural)
2. **New or completed slice** → `SLICE-NN-*.md` + `PRODUCT_OVERVIEW.md` progress
3. **New module or API area** → `CURRENT_ARCHITECTURE.md`
4. **Generation/council/publish behavior** → relevant `apps/backend/*.md`

See [.cursor/rules/docs-sync.mdc](.cursor/rules/docs-sync.mdc) for the full checklist.

## Backend conventions

- Workspace-scoped APIs: `/v1/workspaces/:workspaceId/...`
- Soft delete: filter `deletedAt: null` via `NOT_DELETED`
- Credits: user-scoped (`CreditTransaction`), not workspace-scoped
- Auth: Clerk JWT; LinkedIn tokens in Clerk (not DB)

## Frontend

See [apps/web/AGENTS.md](apps/web/AGENTS.md) for Next.js and UI conventions.
