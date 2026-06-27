-- CreateEnum
CREATE TYPE "AutopilotFrequency" AS ENUM ('three_per_week', 'daily', 'weekdays', 'weekly');

-- AlterEnum
ALTER TYPE "CreditTransactionType" ADD VALUE 'autopilot';

-- CreateTable
CREATE TABLE "autopilot_configs" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "contentProfileId" UUID,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "AutopilotFrequency" NOT NULL DEFAULT 'three_per_week',
    "postingDays" INTEGER[] DEFAULT ARRAY[1, 3, 4, 5, 7]::INTEGER[],
    "postingTime" TEXT NOT NULL DEFAULT '09:00',
    "lastPillarIndex" INTEGER NOT NULL DEFAULT 0,
    "lastRunDateKey" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "autopilot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_configs_workspaceId_key" ON "autopilot_configs"("workspaceId");

-- CreateIndex
CREATE INDEX "autopilot_configs_enabled_idx" ON "autopilot_configs"("enabled");

-- AddForeignKey
ALTER TABLE "autopilot_configs" ADD CONSTRAINT "autopilot_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_configs" ADD CONSTRAINT "autopilot_configs_contentProfileId_fkey" FOREIGN KEY ("contentProfileId") REFERENCES "content_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
