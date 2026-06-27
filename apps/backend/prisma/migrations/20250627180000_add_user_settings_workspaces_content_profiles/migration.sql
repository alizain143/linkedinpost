-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'starter', 'pro', 'agency');

-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('personal', 'client');

-- CreateEnum
CREATE TYPE "ContentGoal" AS ENUM ('build_authority', 'generate_leads', 'grow_audience');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
ADD COLUMN     "emailWeeklyReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailGenerationComplete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailProductUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plan" "UserPlan" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkspaceType" NOT NULL DEFAULT 'personal',
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspaceId","userId")
);

-- CreateTable
CREATE TABLE "content_profiles" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "roleTitle" TEXT,
    "industry" TEXT,
    "targetAudience" TEXT,
    "contentGoal" "ContentGoal" NOT NULL DEFAULT 'build_authority',
    "preferredTone" TEXT,
    "offerDescription" TEXT,
    "writingSample" TEXT,
    "avoidWords" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pillars" (
    "id" UUID NOT NULL,
    "contentProfileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "content_pillars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspaces_ownerId_idx" ON "workspaces"("ownerId");

-- CreateIndex
CREATE INDEX "content_profiles_workspaceId_idx" ON "content_profiles"("workspaceId");

-- CreateIndex
CREATE INDEX "content_pillars_contentProfileId_idx" ON "content_pillars"("contentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "content_pillars_contentProfileId_name_key" ON "content_pillars"("contentProfileId", "name");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_profiles" ADD CONSTRAINT "content_profiles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pillars" ADD CONSTRAINT "content_pillars_contentProfileId_fkey" FOREIGN KEY ("contentProfileId") REFERENCES "content_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
