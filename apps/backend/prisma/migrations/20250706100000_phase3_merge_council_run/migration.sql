-- Phase 3: merge CouncilRun into GenerationJob

-- Add council fields to generation_jobs
ALTER TABLE "generation_jobs" ADD COLUMN "revisionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "generation_jobs" ADD COLUMN "mediaRegenCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "generation_jobs" ADD COLUMN "finalScore" INTEGER;

-- Backfill from council_runs
UPDATE "generation_jobs" gj
SET
  "revisionCount" = cr."revisionCount",
  "mediaRegenCount" = cr."mediaRegenCount",
  "finalScore" = cr."finalScore"
FROM "council_runs" cr
WHERE cr."generationJobId" = gj."id";

-- Repoint council_events to generation_jobs
ALTER TABLE "council_events" ADD COLUMN "generationJobId" UUID;
UPDATE "council_events" ce
SET "generationJobId" = cr."generationJobId"
FROM "council_runs" cr
WHERE ce."councilRunId" = cr."id";
ALTER TABLE "council_events" ALTER COLUMN "generationJobId" SET NOT NULL;
ALTER TABLE "council_events" DROP CONSTRAINT "council_events_councilRunId_fkey";
DROP INDEX IF EXISTS "council_events_councilRunId_stepOrder_idx";
ALTER TABLE "council_events" DROP COLUMN "councilRunId";
CREATE INDEX "council_events_generationJobId_stepOrder_idx" ON "council_events"("generationJobId", "stepOrder");
ALTER TABLE "council_events" ADD CONSTRAINT "council_events_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Repoint post_media to generation_jobs
ALTER TABLE "post_media" ADD COLUMN "generationJobId" UUID;
UPDATE "post_media" pm
SET "generationJobId" = cr."generationJobId"
FROM "council_runs" cr
WHERE pm."councilRunId" = cr."id";
ALTER TABLE "post_media" DROP CONSTRAINT IF EXISTS "post_media_councilRunId_fkey";
DROP INDEX IF EXISTS "post_media_councilRunId_idx";
ALTER TABLE "post_media" DROP COLUMN "councilRunId";
CREATE INDEX "post_media_generationJobId_idx" ON "post_media"("generationJobId");
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "generation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop council_runs
DROP TABLE "council_runs";
DROP TYPE "CouncilRunStatus";
