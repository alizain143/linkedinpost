-- Phase 1: credit audit FK, enum cleanup, subscription index, personal workspace guard

-- CreditTransaction.generationJobId
ALTER TABLE "credit_transactions" ADD COLUMN "generationJobId" UUID;
CREATE INDEX "credit_transactions_generationJobId_idx" ON "credit_transactions"("generationJobId");
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "generation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop redundant subscription index (unique on stripeCustomerId already indexes)
DROP INDEX IF EXISTS "subscriptions_stripeCustomerId_idx";

-- Remove PostPackageStatus.brief_created
ALTER TYPE "PostPackageStatus" RENAME TO "PostPackageStatus_old";
CREATE TYPE "PostPackageStatus" AS ENUM ('draft', 'text_generating', 'text_reviewing', 'media_generating', 'ready_for_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed');
ALTER TABLE "post_packages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "post_packages" ALTER COLUMN "status" TYPE "PostPackageStatus" USING ("status"::text::"PostPackageStatus");
ALTER TABLE "post_packages" ALTER COLUMN "status" SET DEFAULT 'draft';
DROP TYPE "PostPackageStatus_old";

-- Remove CouncilEventStatus.skipped
ALTER TYPE "CouncilEventStatus" RENAME TO "CouncilEventStatus_old";
CREATE TYPE "CouncilEventStatus" AS ENUM ('running', 'completed', 'failed');
ALTER TABLE "council_events" ALTER COLUMN "status" TYPE "CouncilEventStatus" USING ("status"::text::"CouncilEventStatus");
DROP TYPE "CouncilEventStatus_old";

-- One active personal workspace per owner
CREATE UNIQUE INDEX "workspaces_one_personal_per_owner" ON "workspaces"("ownerId") WHERE "type" = 'personal' AND "deletedAt" IS NULL;
