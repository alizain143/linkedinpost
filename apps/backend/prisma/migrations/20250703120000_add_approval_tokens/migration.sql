-- CreateTable
CREATE TABLE "approval_tokens" (
    "id" UUID NOT NULL,
    "postPackageId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "usedAt" TIMESTAMPTZ(6),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_tokens_tokenHash_key" ON "approval_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "approval_tokens_postPackageId_idx" ON "approval_tokens"("postPackageId");

-- CreateIndex
CREATE INDEX "approval_tokens_postPackageId_revokedAt_usedAt_idx" ON "approval_tokens"("postPackageId", "revokedAt", "usedAt");

-- AddForeignKey
ALTER TABLE "approval_tokens" ADD CONSTRAINT "approval_tokens_postPackageId_fkey" FOREIGN KEY ("postPackageId") REFERENCES "post_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_tokens" ADD CONSTRAINT "approval_tokens_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
