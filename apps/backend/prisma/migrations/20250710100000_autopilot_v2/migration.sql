-- CreateEnum
CREATE TYPE "AutopilotApprovalMode" AS ENUM ('require_approval', 'auto_schedule');

-- AlterTable
ALTER TABLE "autopilot_configs" ADD COLUMN "dayProfileOverrides" JSONB,
ADD COLUMN "approvalMode" "AutopilotApprovalMode" NOT NULL DEFAULT 'require_approval';
