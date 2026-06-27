-- CreateEnum
CREATE TYPE "GenerationJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "GenerationJobType" AS ENUM ('quick_draft');

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "GenerationJobType" NOT NULL,
    "status" "GenerationJobStatus" NOT NULL DEFAULT 'pending',
    "flowId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "model" TEXT,
    "input" JSONB NOT NULL,
    "result" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "creditCost" INTEGER NOT NULL DEFAULT 1,
    "creditCharged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_jobs_userId_createdAt_idx" ON "generation_jobs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "generation_jobs_workspaceId_createdAt_idx" ON "generation_jobs"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
