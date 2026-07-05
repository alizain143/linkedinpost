# Slice 18 — XPay subscriptions (backend)

**Status:** Complete (migrated from Stripe to XPay)  
**Phase:** Phase 6 — Business

## One outcome

Paid users can start XPay subscription checkout, cancel via API, and have `User.plan` kept in sync via webhooks — unlocking the correct credit limit and Pro-only features (autopilot, 30-day calendar).

Frontend Billing screen: [FE-SLICE-16](FE-SLICE-16-billing.md).

## Dependencies

- Slice 01: `User.plan`, workspace owner model
- Slice 06: credit limits from `user.plan`
- Slice 14: 30-day calendar generation
- Slice 15: autopilot enable + dispatch

## Prisma

- `SubscriptionStatus` enum
- `Subscription` model (`userId`, XPay IDs, `plan`, status, period fields)
- `User.phone` (E.164, written on checkout)
- `BillingWebhookEvent` for webhook idempotency
- Migrations: `20250703100000_add_stripe_subscription`, `20250707110000_qa_stripe_webhook_status`, `20250711100000_replace_stripe_with_xpay`

## Config

```env
XPAY_PUBLIC_KEY=
XPAY_PRIVATE_KEY=
XPAY_WEBHOOK_SECRET=
XPAY_CURRENCY=USD
XPAY_AMOUNT_STARTER=999
XPAY_AMOUNT_PRO=1999
XPAY_AMOUNT_AGENCY=6999
XPAY_SUBSCRIPTION_CYCLE_COUNT=120
FRONTEND_URL=http://localhost:3000
```

Amounts are in the lowest currency unit (cents for USD). Plan is stored in subscription `metadata.plan` and mirrored on `Subscription.plan`.

XPay requires a finite `cycleCount`; default `120` months approximates an ongoing subscription. Users cancel via `POST /billing/cancel`.

## API

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/v1/billing` | Clerk |
| `POST` | `/v1/billing/checkout` | Clerk |
| `POST` | `/v1/billing/cancel` | Clerk |
| `POST` | `/v1/billing/webhooks/xpay` | XPay signature |

### Checkout body

```json
{ "plan": "starter" | "pro" | "agency", "phone": "+923001234567" }
```

Phone must be E.164. Persisted on `User.phone`.

### GET response

```json
{
  "plan": "pro",
  "subscriptionStatus": "active",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2026-07-27T00:00:00.000Z",
  "xpayCustomerId": null,
  "hasBillingAccount": true
}
```

## Webhooks (v1)

| Event | Action |
|-------|--------|
| `subscription.created` / `subscription.checkout_opened` | Track incomplete subscription only |
| `subscription.active` / `subscription.trialing` | Upsert `Subscription`, set `User.plan` from metadata |
| `subscription.cycle_charged` | Refresh period end from `nextPaymentDate` |
| `subscription.unpaid` | Status `unpaid`, keep paid plan |
| `subscription.paused` | Status `past_due`, keep paid plan |
| `subscription.cancelled` / `subscription.ended` | `User.plan = free`, clear subscription id |

Idempotency: `BillingWebhookEvent.id` = XPay `eventId`, inserted before processing.

Signature: HMAC-SHA512 of raw body with `XPAY_WEBHOOK_SECRET`, header `xpay-signature` (Base64).

## Plan sync rules

| XPay status (mapped) | `User.plan` |
|----------------------|-------------|
| `active`, `trialing` | Map from `metadata.plan` / `Subscription.plan` |
| `past_due`, `unpaid` | Keep paid plan |
| `canceled` / ended | `free` |

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
| `BILLING_UNAVAILABLE` | XPay not configured |
| `ALREADY_SUBSCRIBED` | Active subscription on same plan |
| `BILLING_ACCOUNT_REQUIRED` | Cancel without subscription |
| `NO_ACTIVE_SUBSCRIPTION` | Cancel when not active |
| `WEBHOOK_INVALID` | Bad/missing XPay signature |
| `PLAN_UPGRADE_REQUIRED` | Feature blocked by plan |

## Manual test

1. Create XPay sandbox account; set amounts for Starter, Pro, Agency
2. Set env keys; register webhook URL to `/v1/billing/webhooks/xpay`
3. `POST /billing/checkout` with `{ "plan": "pro", "phone": "+923001234567" }` → complete checkout
4. Verify webhook → `GET /billing` shows `plan: pro`, `GET /credits` shows limit 200
5. Enable autopilot on Pro — succeeds; after cancel — `403`
6. `POST /generate/calendar` with `durationDays: 30` — Pro ok, Starter `403`

## Progress

- [x] Prisma `Subscription` + `BillingWebhookEvent` + XPay migration
- [x] `xpay.config.ts` + `XpayClientService` + `BillingModule`
- [x] Checkout + Cancel + GET billing status
- [x] Webhook verify + `BillingSyncService` plan sync
- [x] `PlanFeatureService` + autopilot + 30-day calendar guards
- [x] Tests + docs
- [x] Migrated from Stripe to XPay

## Out of scope

- Payment-method update UI (no hosted portal)
- Mid-cycle plan upgrades (cancel + new checkout)
- Metered billing / usage-based credits
