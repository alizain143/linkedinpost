# FE-Slice 16 — Billing + Stripe checkout/portal

**Status:** Complete  
**Depends on:** FE-SLICE-04

## Goal

Wire `/app/billing` to Stripe-backed APIs: live plan/subscription status, credit usage, checkout upgrades, Customer Portal management, and checkout return handling.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/billing` |
| `POST` | `/v1/billing/checkout` |
| `POST` | `/v1/billing/portal` |

Maps to backend SLICE-18.

## Delivered

### API layer

- [`lib/api/types/billing.ts`](apps/web/src/lib/api/types/billing.ts) — `ApiBillingStatus`, checkout/portal types
- [`lib/api/billing.ts`](apps/web/src/lib/api/billing.ts) — fetch status, checkout, portal
- [`lib/billing-utils.ts`](apps/web/src/lib/billing-utils.ts) — plan mapping, renewal labels, credit cost table

### Hooks

- [`use-billing-api.ts`](apps/web/src/hooks/api/use-billing-api.ts) — status, checkout, portal mutations, invalidation
- Prefetch in [`app-shell-client.tsx`](apps/web/src/components/app/app-shell-client.tsx)

### UI

- [`Billing.tsx`](apps/web/src/components/sections/app/billing/Billing.tsx) — summary cards, credit bar, plans, manage portal
- [`BillingPlanCard.tsx`](apps/web/src/components/sections/app/billing/BillingPlanCard.tsx) — in-app plan cards with checkout CTAs
- [`/billing`](apps/web/src/app/billing/page.tsx) — redirect shim for Stripe return URLs

## Behaviors

- Summary cards from billing + credits APIs
- Paid plan CTAs redirect to Stripe Checkout
- Subscribers can open Stripe Customer Portal
- `checkout=success|cancel` query handled on `/app/billing` with toast + cache invalidation
- `BILLING_UNAVAILABLE`, `ALREADY_SUBSCRIBED`, `BILLING_ACCOUNT_REQUIRED` error messages
- Mock billing history and usage breakdown removed

## Progress

- [x] Billing types + fetch + utils
- [x] Hooks + query keys
- [x] Billing page + BillingPlanCard
- [x] Checkout return redirect + toasts
- [x] Error messages
- [x] `npm run build` passes

## Test plan (manual)

- [ ] `/app/billing` shows real plan and credit usage
- [ ] Checkout starts for paid plans (Stripe test mode)
- [ ] Success/cancel return URLs work via `/billing` redirect
- [ ] Manage billing opens portal for subscribers
- [ ] Marketing `/pricing` unchanged

## Out of scope

- Stripe webhooks
- Invoice history API
