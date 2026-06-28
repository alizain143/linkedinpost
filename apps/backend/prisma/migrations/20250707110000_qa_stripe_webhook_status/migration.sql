-- Webhook processing status for safe retries
CREATE TYPE "StripeWebhookEventStatus" AS ENUM ('pending', 'processed', 'failed');

ALTER TABLE stripe_webhook_events
  ADD COLUMN status "StripeWebhookEventStatus" NOT NULL DEFAULT 'processed',
  ADD COLUMN error_message TEXT;

-- Existing rows were already handled
UPDATE stripe_webhook_events SET status = 'processed';
