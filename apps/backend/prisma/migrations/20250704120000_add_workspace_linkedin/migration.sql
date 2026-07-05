-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "linkedInClerkExternalAccountId" TEXT,
ADD COLUMN "linkedInMemberId" TEXT,
ADD COLUMN "linkedInProfileName" TEXT,
ADD COLUMN "linkedInProfile" JSONB,
ADD COLUMN "linkedInProfileSyncedAt" TIMESTAMPTZ(6);
