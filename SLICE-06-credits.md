# Slice 06 — Credits Ledger Stub + Check Guard

**Status:** Complete  
**Phase:** Phase 2 — Workflow (closes Phase 2)

## Goal

Minimal per-user credit ledger, `GET /v1/credits`, reusable `CreditsGuard` + `@CreditsCost` for Phase 3 generation routes.

## Dependencies

- Slice 01: `User.plan`, `plan.constants.ts`

## Prisma

- `CreditTransaction` model + `CreditTransactionType` enum
- Migration: `20250627230000_add_credit_transactions`

## API

| Method | Route |
|--------|-------|
| `GET` | `/v1/credits` |

`CreditsService.consume()` implemented but not exposed via HTTP (Phase 3).

## Guard (Phase 3)

```typescript
@UseGuards(ClerkAuthGuard, CreditsGuard)
@CreditsCost(1)
```

## Progress

- [x] Prisma migration
- [x] CreditsService + period util + tests
- [x] CreditsGuard + @CreditsCost + tests
- [x] CreditsController + Swagger
- [x] Dashboard refactor
- [x] PRODUCT_OVERVIEW checkboxes

## Out of scope

Stripe, monthly reset cron, `POST /generate/*`, public consume API

## Test plan

```bash
GET /v1/credits
GET /v1/workspaces/$WS/dashboard/stats
```

Unit tests: `credits-period.util.spec.ts`, `credits.service.spec.ts`, `credits.guard.spec.ts`
