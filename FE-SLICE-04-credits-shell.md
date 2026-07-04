# FE-Slice 04 — Credits Display (Shell)

**Status:** Complete  
**Depends on:** FE-SLICE-01

## Goal

Global credits meter in the app shell; gate generation CTAs when balance is insufficient; handle `CREDITS_EXHAUSTED` with an upgrade path to billing.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/credits` |

Maps to backend SLICE-06 (`credits` module).

## Delivered

### API layer

- [`lib/api/types/credits.ts`](apps/web/src/lib/api/types/credits.ts) — `ApiCreditsBalance`
- [`lib/api/credits.ts`](apps/web/src/lib/api/credits.ts) — `fetchCredits`
- [`lib/credit-costs.ts`](apps/web/src/lib/credit-costs.ts) — generation mode costs + `canAffordCredits` helpers
- [`lib/credits-errors.ts`](apps/web/src/lib/credits-errors.ts) — `isCreditsExhaustedError`

### Hooks

- [`use-credits-api.ts`](apps/web/src/hooks/api/use-credits-api.ts) — `useCredits`, `useInvalidateCredits`
- Prefetch in [`app-shell-client.tsx`](apps/web/src/components/app/app-shell-client.tsx)

### UI

- [`credits-meter.tsx`](apps/web/src/components/app/credits-meter.tsx) — sidebar meter with progress bar, reset date, billing CTA
- [`app-sidebar.tsx`](apps/web/src/components/app/app-sidebar.tsx) — desktop + mobile footer wired
- [`app-topbar.tsx`](apps/web/src/components/app/app-topbar.tsx) — Generate dropdown gated when `remaining < 1`
- [`Generate.tsx`](apps/web/src/components/sections/app/generate/Generate.tsx) — mode-cost gating + upgrade banner
- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx) — hero Generate button gated

### Errors

- [`api-error-messages.ts`](apps/web/src/lib/api-error-messages.ts) — friendly `CREDITS_EXHAUSTED` message

## Behaviors

- Sidebar shows `{remaining} / {limit}` and `percentUsed` progress bar
- Plan badge prefers `GET /credits` plan over `/auth/me`
- Free plan or zero remaining → **Upgrade plan** CTA; paid with credits → **View billing**
- Generation blocked with toast + redirect to `/app/billing`
- `useInvalidateCredits()` ready for FE-SLICE-12+ mutations

## Progress

- [x] Credits types + fetch
- [x] TanStack Query hook + shell prefetch
- [x] CreditsMeter in sidebar (desktop + mobile)
- [x] Topbar / Generate / Dashboard gating
- [x] CREDITS_EXHAUSTED error helper
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Sidebar shows real remaining/limit and progress bar
- [ ] Mobile drawer shows same meter
- [ ] Reset date matches API `periodEnd`
- [ ] Free user sees Upgrade plan CTA
- [ ] Exhausted account: topbar Generate blocked with toast + billing redirect
- [ ] Generate page: council mode blocked when `remaining < 3`
- [ ] Dashboard Generate One Post blocked when exhausted
- [ ] Credits load error shows retry in meter

## Out of scope

- XPay checkout/cancel (FE-SLICE-16)
- Dashboard credit usage card (FE-SLICE-05)
- Real generation API (FE-SLICE-12)
