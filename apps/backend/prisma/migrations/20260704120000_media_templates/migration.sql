-- CreateEnum
CREATE TYPE "MediaMode" AS ENUM ('freestyle', 'template');

-- AlterEnum
ALTER TYPE "PostMediaType" ADD VALUE 'template';

-- AlterTable
ALTER TABLE "workspaces"
ADD COLUMN "defaultMediaMode" "MediaMode" NOT NULL DEFAULT 'freestyle',
ADD COLUMN "defaultMediaTemplateId" UUID;

-- AlterTable
ALTER TABLE "content_profiles"
ADD COLUMN "defaultMediaTemplateId" UUID;

-- AlterTable
ALTER TABLE "post_packages"
ADD COLUMN "mediaMode" "MediaMode",
ADD COLUMN "mediaTemplateId" UUID;

-- CreateTable
CREATE TABLE "media_templates" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "width" INTEGER NOT NULL DEFAULT 1080,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "layout" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "media_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_templates_workspaceId_deletedAt_idx" ON "media_templates"("workspaceId", "deletedAt");

-- AddForeignKey
ALTER TABLE "media_templates" ADD CONSTRAINT "media_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_defaultMediaTemplateId_fkey" FOREIGN KEY ("defaultMediaTemplateId") REFERENCES "media_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "content_profiles" ADD CONSTRAINT "content_profiles_defaultMediaTemplateId_fkey" FOREIGN KEY ("defaultMediaTemplateId") REFERENCES "media_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "post_packages" ADD CONSTRAINT "post_packages_mediaTemplateId_fkey" FOREIGN KEY ("mediaTemplateId") REFERENCES "media_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
