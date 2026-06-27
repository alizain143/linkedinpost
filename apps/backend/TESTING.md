# Backend testing

Unit tests for business logic in `apps/backend`. No database required for the default suite — Prisma and workspace guards are mocked.

## Commands

```bash
cd apps/backend

# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report (output in apps/backend/coverage)
npm run test:cov
```

E2E tests (require running API + DB) are separate:

```bash
npm run test:e2e
```

## Layout

| Path | Purpose |
|------|---------|
| `src/**/*.spec.ts` | Unit tests co-located with modules |
| `src/test/fixtures.ts` | Shared factory builders (`buildPost`, `buildUser`, …) |
| `src/test/prisma.mock.ts` | `createMockPrismaService()` for service tests |
| `test/*.e2e-spec.ts` | HTTP integration tests (add when CI has DB) |

## What is covered

### Pure logic (no Nest DI)

- `post-status.transitions` — allowed transitions, pipeline column order/labels
- `post.mapper` — response/summary/version mapping
- `user.mapper` — notification prefs, plan
- `plan.constants` — credit limits per tier
- `calendar-date.util` — month grid, week range, timezone date keys
- `approvals.constants` — tab → Prisma filter mapping
- `credits-period.util` — UTC month period boundaries

### Services (mocked Prisma + WorkspacesService)

- `WorkspacesService` — `ensurePersonalWorkspace`, `assertMember`, `getCurrentWorkspace`
- `PostsService` — draft edit guards, status transitions, pipeline columns, approval actions
- `DashboardService` — stats aggregation, preview truncation, credits via CreditsService
- `ContentProfilesService` — default profile rules, delete promotion
- `CalendarService` — month/week/list grouping, status filter, workspace guard
- `ApprovalsService` — tab queue, counts, client workspace aggregation
- `CreditsService` — balance, assertHasCredits, consume ledger rows

## Conventions

1. **Co-locate** specs next to the file under test (`foo.service.ts` → `foo.service.spec.ts`).
2. **Mock at boundaries** — Prisma and external services, not internal pure functions.
3. **Use fixtures** from `src/test/fixtures.ts` for consistent IDs and dates.
4. **Assert error codes** — `expect(error.getResponse()).toMatchObject({ code: '...' })` for HTTP exceptions.
5. **New features** — add unit tests in the same PR as the implementation (per slice).

## Adding tests for a new slice

1. Pure helpers → direct `describe` tests, no mocks.
2. Service methods → `Test.createTestingModule` + `createMockPrismaService()`.
3. Document the slice’s critical paths in the slice’s root `SLICE-XX-*.md` test plan section.
4. Run `npm test` before marking the slice complete.

## Not covered yet

- Controllers (thin; covered indirectly via services)
- Clerk auth guard / webhooks
- R2 document upload
- Full HTTP e2e against Postgres (planned for CI with `test:e2e`)
