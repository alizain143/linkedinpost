-- AlterEnum
ALTER TYPE "GenerationJobType" ADD VALUE 'council';

-- CreateEnum
CREATE TYPE "CouncilAgentRole" AS ENUM ('writer', 'reviewer', 'editor', 'media_creator', 'media_reviewer');
CREATE TYPE "CouncilEventStatus" AS ENUM ('running', 'completed', 'failed', 'skipped');
CREATE TYPE "CouncilRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- AlterTable
ALTER TABLE "generation_jobs" ADD COLUMN "postPackageId" UUID,
ADD COLUMN "currentStep" TEXT,
ADD COLUMN "progress" JSONB;

-- CreateTable
CREATE TABLE "council_runs" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "generationJobId" UUID NOT NULL,
    "postPackageId" UUID NOT NULL,
    "status" "CouncilRunStatus" NOT NULL DEFAULT 'pending',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "mediaRegenCount" INTEGER NOT NULL DEFAULT 0,
    "finalScore" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "council_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "council_events" (
    "id" UUID NOT NULL,
    "councilRunId" UUID NOT NULL,
    "agentRole" "CouncilAgentRole" NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "revisionAttempt" INTEGER NOT NULL DEFAULT 1,
    "status" "CouncilEventStatus" NOT NULL,
    "label" TEXT NOT NULL,
    "output" JSONB,
    "scores" JSONB,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "durationMs" INTEGER,

    CONSTRAINT "council_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "council_runs_generationJobId_key" ON "council_runs"("generationJobId");
CREATE INDEX "council_runs_postPackageId_idx" ON "council_runs"("postPackageId");
CREATE INDEX "council_events_councilRunId_stepOrder_idx" ON "council_events"("councilRunId", "stepOrder");
CREATE INDEX "generation_jobs_postPackageId_idx" ON "generation_jobs"("postPackageId");

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_postPackageId_fkey" FOREIGN KEY ("postPackageId") REFERENCES "post_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "council_runs" ADD CONSTRAINT "council_runs_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "council_runs" ADD CONSTRAINT "council_runs_postPackageId_fkey" FOREIGN KEY ("postPackageId") REFERENCES "post_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "council_events" ADD CONSTRAINT "council_events_councilRunId_fkey" FOREIGN KEY ("councilRunId") REFERENCES "council_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
