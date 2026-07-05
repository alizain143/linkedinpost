-- AlterTable
ALTER TABLE "post_media" ADD COLUMN "archivedAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "post_media_postPackageId_archivedAt_idx" ON "post_media"("postPackageId", "archivedAt");
