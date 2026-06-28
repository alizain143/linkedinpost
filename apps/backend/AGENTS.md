# Backend agent instructions

NestJS API in `apps/backend`. Parent repo docs: [../../AGENTS.md](../../AGENTS.md).

## Essential reads

- [../../DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) — all tables and fields
- [../../CURRENT_ARCHITECTURE.md](../../CURRENT_ARCHITECTURE.md) — modules and flows
- `prisma/schema.prisma` — schema source of truth

## Doc sync on backend changes

| Change | Update |
|--------|--------|
| `prisma/schema.prisma` or migration | `DATABASE_SCHEMA.md` |
| New/changed module or route | `CURRENT_ARCHITECTURE.md`, `PRODUCT_OVERVIEW.md` if user-facing |
| Completed slice | `SLICE-NN-*.md`, `PRODUCT_OVERVIEW.md` tracker |
| Council/generation/publish/scheduling | `COUNCIL.md`, `GENERATION.md`, `PUBLISHING.md`, `SCHEDULING.md` as applicable |

Follow [.cursor/rules/docs-sync.mdc](../../.cursor/rules/docs-sync.mdc).

## Patterns

- Modules under `src/modules/<name>/`
- Mappers: `*.mapper.ts` — DB → API response
- Status machines: `*-status.transitions.ts` with tests
- Tests: `*.spec.ts` next to source; fixtures in `src/test/fixtures.ts`
