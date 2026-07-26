# FE-Slice 16 — Billing + Lemon Squeezy checkout/cancel

**Status:** Complete  
**Depends on:** FE-SLICE-04

## Goal

Wire `/app/billing` to Lemon Squeezy–backed APIs: live plan/subscription status, credit usage, checkout upgrades, cancel at period end, and checkout return handling.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/billing` |
| `POST` | `/v1/billing/checkout` |
| `POST` | `/v1/billing/cancel` |

Maps to backend SLICE-18.

## Delivered

- [`apps/web/src/lib/api/billing.ts`](apps/web/src/lib/api/billing.ts) + types
- [`use-billing-api.ts`](apps/web/src/hooks/api/use-billing-api.ts)
- [`Billing.tsx`](apps/web/src/components/sections/app/billing/Billing.tsx) — summary cards, credit bar, plans, cancel
- Paid plan CTAs redirect to Lemon checkout URL
- Cancel sets period-end cancellation (access until expiry)
- Return query `?checkout=success|cancel` handled

## Done when

- [x] Billing status + credits wired
- [x] Checkout without phone
- [x] Cancel at period end UX
- [x] Return URL handling

## Manual QA

- [ ] Checkout starts for paid plans (Lemon test mode)
- [ ] Cancel shows “cancels on …” and keeps plan until expiry

## Out of scope

- Lemon webhooks (backend)
