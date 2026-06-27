-- CreateTable
CREATE TABLE "linkedin_connections" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "linkedInMemberId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMPTZ(6) NOT NULL,
    "scope" TEXT,
    "profileName" TEXT,
    "profileEmail" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "linkedin_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_connections_userId_key" ON "linkedin_connections"("userId");

-- AddForeignKey
ALTER TABLE "linkedin_connections" ADD CONSTRAINT "linkedin_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
