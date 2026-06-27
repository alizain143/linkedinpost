-- CreateEnum
CREATE TYPE "PostPackageStatus" AS ENUM ('draft', 'brief_created', 'text_generating', 'text_reviewing', 'media_generating', 'ready_for_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed');

-- CreateEnum
CREATE TYPE "PostSource" AS ENUM ('manual', 'calendar', 'autopilot', 'generation');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('personal_story', 'list_post', 'how_to', 'contrarian_take', 'hot_take', 'case_study');

-- CreateTable
CREATE TABLE "post_packages" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "contentProfileId" UUID,
    "hook" TEXT NOT NULL,
    "body" TEXT,
    "cta" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topic" TEXT,
    "postType" "PostType",
    "tone" TEXT,
    "pillar" TEXT,
    "source" "PostSource" NOT NULL DEFAULT 'manual',
    "status" "PostPackageStatus" NOT NULL DEFAULT 'draft',
    "score" INTEGER,
    "scheduledAt" TIMESTAMPTZ(6),
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "post_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_versions" (
    "id" UUID NOT NULL,
    "postPackageId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "hook" TEXT,
    "body" TEXT,
    "cta" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_packages_workspaceId_idx" ON "post_packages"("workspaceId");

-- CreateIndex
CREATE INDEX "post_packages_workspaceId_status_idx" ON "post_packages"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "post_packages_workspaceId_updatedAt_idx" ON "post_packages"("workspaceId", "updatedAt");

-- CreateIndex
CREATE INDEX "post_versions_postPackageId_idx" ON "post_versions"("postPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "post_versions_postPackageId_versionNumber_key" ON "post_versions"("postPackageId", "versionNumber");

-- AddForeignKey
ALTER TABLE "post_packages" ADD CONSTRAINT "post_packages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_packages" ADD CONSTRAINT "post_packages_contentProfileId_fkey" FOREIGN KEY ("contentProfileId") REFERENCES "content_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_postPackageId_fkey" FOREIGN KEY ("postPackageId") REFERENCES "post_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
