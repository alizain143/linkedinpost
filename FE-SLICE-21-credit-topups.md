# FE-Slice 21 — Credit top-ups + billing history

**Status:** Complete  
**Depends on:** FE-SLICE-16 (billing), FE-SLICE-04 (credits), SLICE-25

## Goal

Billing page: buy credits (quantity + live quote), transaction history (subscription + credit purchases), return handling after Lemon checkout.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/billing/credits/quote` |
| `POST` | `/v1/billing/credits/checkout` |
| `GET` | `/v1/billing/transactions` |

## Delivered

- Buy credits section (`#buy-credits`)
- Transaction history list + load more
- Hooks: quote, checkout, transactions
- Out-of-credits secondary CTA → billing buy credits

## Done when

- [x] Quote UI + checkout redirect
- [x] History list wired
- [x] Return `?checkout=credits_success` refreshes balance + history
