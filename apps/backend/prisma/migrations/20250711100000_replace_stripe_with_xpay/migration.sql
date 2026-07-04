-- User phone for XPay checkout (E.164)
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- Subscription: Stripe IDs → XPay IDs + plan
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_stripeCustomerId_key";
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_stripeSubscriptionId_key";
DROP INDEX IF EXISTS "subscriptions_stripeCustomerId_idx";
DROP INDEX IF EXISTS "subscriptions_stripeCustomerId_key";
DROP INDEX IF EXISTS "subscriptions_stripeSubscriptionId_key";

ALTER TABLE "subscriptions" RENAME COLUMN "stripeCustomerId" TO "xpayCustomerId";
ALTER TABLE "subscriptions" ALTER COLUMN "xpayCustomerId" DROP NOT NULL;

ALTER TABLE "subscriptions" RENAME COLUMN "stripeSubscriptionId" TO "xpaySubscriptionId";

ALTER TABLE "subscriptions" DROP COLUMN "stripePriceId";
ALTER TABLE "subscriptions" ADD COLUMN "plan" "UserPlan";

CREATE UNIQUE INDEX "subscriptions_xpayCustomerId_key" ON "subscriptions"("xpayCustomerId");
CREATE UNIQUE INDEX "subscriptions_xpaySubscriptionId_key" ON "subscriptions"("xpaySubscriptionId");

-- Webhook idempotency: Stripe → provider-neutral billing events
ALTER TYPE "StripeWebhookEventStatus" RENAME TO "BillingWebhookEventStatus";

ALTER TABLE "stripe_webhook_events" RENAME TO "billing_webhook_events";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'billing_webhook_events' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE "billing_webhook_events" RENAME COLUMN "error_message" TO "errorMessage";
  END IF;
END $$;
