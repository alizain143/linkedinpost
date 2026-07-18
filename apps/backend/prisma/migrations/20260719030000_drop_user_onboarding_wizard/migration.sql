-- Drop setup-wizard columns; keep toursSeen + lastAcknowledgedPlan
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboardingCompletedAt",
DROP COLUMN IF EXISTS "onboardingLinkedInSkippedAt",
DROP COLUMN IF EXISTS "onboardingVersion";
