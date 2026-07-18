-- AlterTable
ALTER TABLE "users" ADD COLUMN "onboardingCompletedAt" TIMESTAMPTZ(6),
ADD COLUMN "onboardingLinkedInSkippedAt" TIMESTAMPTZ(6),
ADD COLUMN "onboardingVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "toursSeen" JSONB,
ADD COLUMN "lastAcknowledgedPlan" "UserPlan";

-- Existing accounts: skip forced setup wizard and avoid unlock modals on deploy
UPDATE "users"
SET
  "onboardingCompletedAt" = COALESCE("createdAt", NOW()),
  "lastAcknowledgedPlan" = "plan"
WHERE "onboardingCompletedAt" IS NULL;
