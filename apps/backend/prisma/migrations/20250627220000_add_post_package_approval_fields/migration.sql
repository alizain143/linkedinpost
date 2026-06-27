-- AlterTable
ALTER TABLE "post_packages" ADD COLUMN "submittedForApprovalAt" TIMESTAMPTZ(6),
ADD COLUMN "approvalFeedback" TEXT;
