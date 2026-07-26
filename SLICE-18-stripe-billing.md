# Slice 18 — Lemon Squeezy subscriptions (backend)

**Status:** Complete (migrated from Stripe → XPay → Lemon Squeezy)  
**Phase:** Phase 6 — Business

## One outcome

Paid users can start Lemon Squeezy subscription checkout, cancel at period end via API, and have `User.plan` kept in sync via webhooks — unlocking the correct credit limit and Pro-only features (autopilot, 30-day calendar).

Frontend Billing screen: [FE-SLICE-16](FE-SLICE-16-billing.md).

## Dependencies

- Slice 01: `User.plan`, workspace owner model
- Slice 06: credit limits from `user.plan`
- Slice 14: 30-day calendar generation
- Slice 15: autopilot enable + dispatch

## Prisma

- `SubscriptionStatus` enum
- `Subscription` model (`userId`, Lemon IDs, `plan`, status, period fields)
- `BillingWebhookEvent` for webhook idempotency
- Migrations: `…_add_stripe_subscription`, `…_replace_stripe_with_xpay`, `20260726120000_replace_xpay_with_lemonsqueezy`

## Config

```env
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_VARIANT_PRO=
LEMONSQUEEZY_VARIANT_AGENCY=
FRONTEND_URL=http://localhost:3000
```

Plan prices live in Lemon Squeezy product variants. Checkout passes `custom.user_id` + `custom.plan`; webhooks also map `variant_id` → plan.

## API

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/v1/billing` | Clerk |
| `POST` | `/v1/billing/checkout` | Clerk |
| `POST` | `/v1/billing/cancel` | Clerk |
| `POST` | `/v1/billing/webhooks/lemonsqueezy` | Lemon `X-Signature` |

### Checkout body

```json
{ "plan": "pro" | "agency" }
```

### GET response

```json
{
  "plan": "pro",
  "subscriptionStatus": "active",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2026-08-26T00:00:00.000Z",
  "lemonCustomerId": "123",
  "hasBillingAccount": true
}
```

## Webhooks

| Event | Action |
|-------|--------|
| `subscription_created` / `subscription_updated` / `subscription_payment_success` / `subscription_resumed` / `subscription_unpaused` | Upsert `Subscription`, set `User.plan` from custom data or variant |
| `subscription_cancelled` | Set `cancelAtPeriodEnd=true`; keep paid plan until expiry |
| `subscription_paused` / `subscription_payment_failed` | `past_due` (plan kept) |
| `subscription_expired` | Clear subscription, set `User.plan=free` |

Idempotency: `BillingWebhookEvent.id` = hash of event name + subscription id + updated_at + status.

Signature: HMAC-SHA256 hex of raw body with `LEMONSQUEEZY_WEBHOOK_SECRET`, header `X-Signature`.

## Cancel

`POST /billing/cancel` calls Lemon `PATCH /v1/subscriptions/:id` with `cancelled: true` (cancel at period end). Local row sets `cancelAtPeriodEnd=true`; access remains until `subscription_expired`.

## Manual test

1. Create Lemon products/variants for Starter, Pro, Agency; copy variant IDs
2. Set env keys; register webhook to `/v1/billing/webhooks/lemonsqueezy`
3. Checkout → redirect → webhook → `User.plan` updates
4. Cancel → `cancelAtPeriodEnd` true; expire → free

## Done when

- [x] Prisma `Subscription` + Lemon migration
- [x] Checkout / cancel / webhook sync
- [x] Plan feature gates unchanged
- [x] Frontend phone field removed
