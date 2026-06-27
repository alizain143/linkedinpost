-- AlterTable
ALTER TABLE "users" ADD COLUMN "linkedInMemberId" TEXT,
ADD COLUMN "linkedInProfileSyncedAt" TIMESTAMPTZ(6),
ADD COLUMN "linkedInProfile" JSONB;

-- AlterTable
ALTER TABLE "post_packages" ADD COLUMN "linkedInPostId" TEXT,
ADD COLUMN "linkedInPostUrl" TEXT,
ADD COLUMN "publishErrorCode" TEXT,
ADD COLUMN "publishErrorMessage" TEXT,
ADD COLUMN "publishAttemptedAt" TIMESTAMPTZ(6);
