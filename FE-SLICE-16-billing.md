# FE-Slice 16 — Billing + XPay checkout/cancel

**Status:** Complete  
**Depends on:** FE-SLICE-04

## Goal

Wire `/app/billing` to XPay-backed APIs: live plan/subscription status, credit usage, checkout upgrades (with phone), cancel subscription, and checkout return handling.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/billing` |
| `POST` | `/v1/billing/checkout` |
| `POST` | `/v1/billing/cancel` |

Maps to backend SLICE-18.

## Delivered

### API layer

- [`lib/api/types/billing.ts`](apps/web/src/lib/api/types/billing.ts) — `ApiBillingStatus`, checkout/cancel types
- [`lib/api/billing.ts`](apps/web/src/lib/api/billing.ts) — fetch status, checkout, cancel
- [`lib/billing-utils.ts`](apps/web/src/lib/billing-utils.ts) — plan mapping, renewal labels, credit cost table

### Hooks

- [`use-billing-api.ts`](apps/web/src/hooks/api/use-billing-api.ts) — status, checkout, cancel mutations, invalidation
- Prefetch in [`app-shell-client.tsx`](apps/web/src/components/app/app-shell-client.tsx)

### UI

- [`Billing.tsx`](apps/web/src/components/sections/app/billing/Billing.tsx) — summary cards, credit bar, phone field, plans, cancel
- [`BillingPlanCard.tsx`](apps/web/src/components/sections/app/billing/BillingPlanCard.tsx) — in-app plan cards with checkout CTAs
- [`/billing`](apps/web/src/app/billing/page.tsx) — redirect shim for return URLs

## Behaviors

- Summary cards from billing + credits APIs
- Phone (E.164) required before paid plan checkout
- Paid plan CTAs redirect to XPay checkout (`fwdUrl`)
- Subscribers can cancel subscription (confirm dialog)
- `checkout=success|cancel` and `subscription_id` query handled on `/app/billing` with toast + cache invalidation
- `BILLING_UNAVAILABLE`, `ALREADY_SUBSCRIBED`, `BILLING_ACCOUNT_REQUIRED` error messages

## Progress

- [x] Billing types + fetch + utils
- [x] Hooks + query keys
- [x] Billing page + BillingPlanCard
- [x] Checkout return redirect + toasts
- [x] Phone collection for XPay
- [x] Cancel subscription (replaces portal)
- [x] Error messages

## Test plan (manual)

- [ ] `/app/billing` shows real plan and credit usage
- [ ] Checkout starts for paid plans with phone (XPay sandbox)
- [ ] Success/cancel return URLs work
- [ ] Cancel subscription works for subscribers
- [ ] Marketing `/pricing` unchanged

## Out of scope

- XPay webhooks (backend)
- Invoice history API
- Payment-method update UI
