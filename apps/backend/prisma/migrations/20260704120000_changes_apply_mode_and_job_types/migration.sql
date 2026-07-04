-- CreateEnum
CREATE TYPE "ChangesApplyMode" AS ENUM ('review_first', 'auto_apply');

-- AlterEnum
ALTER TYPE "GenerationJobType" ADD VALUE 'quick_draft_single';
ALTER TYPE "GenerationJobType" ADD VALUE 'revise_draft';

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "changesApplyMode" "ChangesApplyMode" NOT NULL DEFAULT 'review_first';
