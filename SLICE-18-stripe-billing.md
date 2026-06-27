# Slice 18 — Stripe subscriptions (backend)

**Status:** Complete  
**Phase:** Phase 6 — Business

## One outcome

Paid users can start Stripe Checkout, manage billing via Customer Portal, and have `User.plan` kept in sync via webhooks — unlocking the correct credit limit and Pro-only features (autopilot, 30-day calendar).

No frontend Billing screen in this slice.

## Dependencies

- Slice 01: `User.plan`, workspace owner model
- Slice 06: credit limits from `user.plan`
- Slice 14: 30-day calendar generation
- Slice 15: autopilot enable + dispatch

## Prisma

- `SubscriptionStatus` enum
- `Subscription` model (`userId`, Stripe IDs, status, period fields)
- `StripeWebhookEvent` for webhook idempotency
- Migration: `20250703100000_add_stripe_subscription`

## Config

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
FRONTEND_URL=http://localhost:3000
```

Price IDs map to `UserPlan` via `stripe-plan.map.ts`.

## API

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/v1/billing` | Clerk |
| `POST` | `/v1/billing/checkout` | Clerk |
| `POST` | `/v1/billing/portal` | Clerk |
| `POST` | `/v1/billing/webhooks/stripe` | Stripe signature |

### Checkout body

```json
{ "plan": "starter" | "pro" | "agency" }
```

### GET response

```json
{
  "plan": "pro",
  "subscriptionStatus": "active",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2026-07-27T00:00:00.000Z",
  "stripeCustomerId": "cus_..."
}
```

## Webhooks (v1)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link customer; sync subscription if subscription mode |
| `customer.subscription.created` | Upsert `Subscription`, set `User.plan` from price |
| `customer.subscription.updated` | Sync status, period, cancel flag, plan |
| `customer.subscription.deleted` | `User.plan = free`, clear subscription id |
| `invoice.payment_failed` | Set status `past_due` |

Idempotency: `StripeWebhookEvent.id` inserted before processing.

## Plan sync rules

| Stripe status | `User.plan` |
|---------------|-------------|
| `active`, `trialing` | Map from `stripePriceId` |
| `past_due` | Keep paid plan |
| `canceled`, `unpaid`, deleted | `free` |

Credit period remains UTC calendar month; only the **limit** changes when plan changes mid-month.

## Plan feature guards

| Feature | Allowed plans |
|---------|---------------|
| `autopilot` | Pro, Agency |
| `calendar_30_day` | Pro, Agency |

- `AutopilotService.upsertConfig` — when `enabled: true`, assert workspace **owner** plan
- `CalendarJobService.enqueueCalendar` — when `durationDays === 30`, assert user plan
- `AutopilotDispatchService` — skip dispatch if owner downgraded (log warn)

Error code: `403 PLAN_UPGRADE_REQUIRED`

## Error codes

| Code | When |
|------|------|
| `BILLING_UNAVAILABLE` | Stripe not configured |
| `ALREADY_SUBSCRIBED` | Active subscription on same plan |
| `WEBHOOK_INVALID` | Bad/missing Stripe signature |
| `PLAN_UPGRADE_REQUIRED` | Feature blocked by plan |

## Manual test

1. Create Stripe test products/prices for Starter, Pro, Agency
2. Set env keys + `stripe listen --forward-to localhost:3000/v1/billing/webhooks/stripe`
3. `POST /billing/checkout` with `{ "plan": "pro" }` → complete Checkout
4. Verify webhook → `GET /billing` shows `plan: pro`, `GET /credits` shows limit 200
5. Enable autopilot on Pro — succeeds; after cancel/downgrade — `403`
6. `POST /generate/calendar` with `durationDays: 30` — Pro ok, Starter `403`

## Progress

- [x] Prisma `Subscription` + `StripeWebhookEvent` + migration
- [x] `stripe` package + `stripe.config.ts` + `BillingModule`
- [x] Checkout + Portal + GET billing status
- [x] Webhook verify + `BillingSyncService` plan sync
- [x] `PlanFeatureService` + autopilot + 30-day calendar guards
- [x] Tests + docs

## Out of scope (Slice 19+)

- Agency client workspaces
- Approval share links
- Frontend Billing screen
- Metered billing / usage-based credits
