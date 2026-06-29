-- CreateEnum
CREATE TYPE "PostMediaType" AS ENUM ('quote_card');

-- CreateEnum
CREATE TYPE "PostMediaSource" AS ENUM ('council');

-- CreateTable
CREATE TABLE "post_media" (
    "id" UUID NOT NULL,
    "postPackageId" UUID NOT NULL,
    "councilRunId" UUID,
    "mediaType" "PostMediaType" NOT NULL,
    "source" "PostMediaSource" NOT NULL DEFAULT 'council',
    "storageKey" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_media_postPackageId_idx" ON "post_media"("postPackageId");

-- CreateIndex
CREATE INDEX "post_media_councilRunId_idx" ON "post_media"("councilRunId");

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_postPackageId_fkey" FOREIGN KEY ("postPackageId") REFERENCES "post_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_councilRunId_fkey" FOREIGN KEY ("councilRunId") REFERENCES "council_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
