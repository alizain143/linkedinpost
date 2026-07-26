-- Rename XPay provider columns to Lemon Squeezy
DROP INDEX IF EXISTS "subscriptions_xpayCustomerId_key";
DROP INDEX IF EXISTS "subscriptions_xpaySubscriptionId_key";

ALTER TABLE "subscriptions" RENAME COLUMN "xpayCustomerId" TO "lemonCustomerId";
ALTER TABLE "subscriptions" RENAME COLUMN "xpaySubscriptionId" TO "lemonSubscriptionId";

CREATE UNIQUE INDEX "subscriptions_lemonCustomerId_key" ON "subscriptions"("lemonCustomerId");
CREATE UNIQUE INDEX "subscriptions_lemonSubscriptionId_key" ON "subscriptions"("lemonSubscriptionId");
