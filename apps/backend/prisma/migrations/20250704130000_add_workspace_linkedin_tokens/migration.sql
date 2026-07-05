-- Per-workspace LinkedIn OAuth tokens (Clerk allows only one LinkedIn account per user)
ALTER TABLE "workspaces" ADD COLUMN "linkedInAccessToken" TEXT,
ADD COLUMN "linkedInRefreshToken" TEXT,
ADD COLUMN "linkedInTokenExpiresAt" TIMESTAMPTZ(6);
