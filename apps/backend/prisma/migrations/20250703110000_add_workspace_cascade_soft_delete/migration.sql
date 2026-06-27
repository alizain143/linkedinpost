-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "deletedAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "autopilot_configs" ADD COLUMN "deletedAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "content_profiles" ADD COLUMN "deletedAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "post_packages" ADD COLUMN "deletedAt" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "generation_jobs" ADD COLUMN "deletedAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "workspaces_ownerId_type_deletedAt_idx" ON "workspaces"("ownerId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "autopilot_configs_workspaceId_deletedAt_idx" ON "autopilot_configs"("workspaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "content_profiles_workspaceId_deletedAt_idx" ON "content_profiles"("workspaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "post_packages_workspaceId_deletedAt_idx" ON "post_packages"("workspaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "generation_jobs_workspaceId_deletedAt_idx" ON "generation_jobs"("workspaceId", "deletedAt");
