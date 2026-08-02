-- AlterEnum
ALTER TYPE "PostMediaType" ADD VALUE 'uploaded';

-- CreateEnum
CREATE TYPE "PostMediaUploadStatus" AS ENUM ('pending', 'ready');

-- AlterTable
ALTER TABLE "post_media" ADD COLUMN "mediaBatchId" UUID,
ADD COLUMN "uploadStatus" "PostMediaUploadStatus",
ADD COLUMN "uploadExpiresAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "post_media_mediaBatchId_idx" ON "post_media"("mediaBatchId");

-- CreateIndex
CREATE INDEX "post_media_uploadStatus_uploadExpiresAt_idx" ON "post_media"("uploadStatus", "uploadExpiresAt");

-- Backfill mediaBatchId for existing rows (group by generationJobId when present, else id)
UPDATE "post_media"
SET "mediaBatchId" = COALESCE("generationJobId", "id")
WHERE "mediaBatchId" IS NULL;
