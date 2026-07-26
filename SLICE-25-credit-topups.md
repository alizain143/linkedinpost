# Slice 25 — Credit top-ups + billing transactions (backend)

**Status:** Complete  
**Phase:** Phase 6 — Business  
**Depends on:** SLICE-06 (credits), SLICE-18 (Lemon billing)

## One outcome

Users can buy extra credits (custom quantity + bulk pricing) via Lemon Squeezy one-time checkout; purchases increase the current-period credit allowance. Billing history lists subscription charges and credit purchases from local webhook mirrors.

Frontend: [FE-SLICE-21-credit-topups.md](FE-SLICE-21-credit-topups.md).

## Pricing

Base **$0.20/credit**. Min **25**, max **2000**.

| Credits | $/credit |
|---------|----------|
| 25–99 | 0.20 |
| 100–249 | 0.17 |
| 250–499 | 0.14 |
| 500–2000 | 0.12 |

## Balance

`limit = planLimit + purchased` where `purchased` = sum of positive `purchase` transactions in the current credit period.

## Prisma

- `CreditTransactionType.purchase`
- `CreditTransaction.providerRef` (unique, `lemon_order:{id}`)
- `BillingTransaction` + enums `BillingTransactionType`, `BillingTransactionStatus`

## Config

```env
LEMONSQUEEZY_VARIANT_CREDITS=
```

## API

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/v1/billing/credits/quote?credits=` | Clerk |
| `POST` | `/v1/billing/credits/checkout` | Clerk `{ credits }` |
| `GET` | `/v1/billing/transactions` | Clerk |

## Webhooks

- `order_created` + `custom_data.credits` → grant + `credit_purchase` row
- `subscription_payment_success` → `subscription_payment` row
- `subscription_payment_failed` → failed row
- `order_refunded` / `subscription_payment_refunded` → refunded

## Done when

- [x] Quote + checkout + grant idempotent
- [x] Balance includes purchased
- [x] Transaction list API
- [x] Docs + tests
