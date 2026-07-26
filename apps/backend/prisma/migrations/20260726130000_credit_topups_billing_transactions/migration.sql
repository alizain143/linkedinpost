-- AlterEnum
ALTER TYPE "CreditTransactionType" ADD VALUE 'purchase';

-- AlterTable
ALTER TABLE "credit_transactions" ADD COLUMN "providerRef" TEXT;
CREATE UNIQUE INDEX "credit_transactions_providerRef_key" ON "credit_transactions"("providerRef");

-- CreateEnum
CREATE TYPE "BillingTransactionType" AS ENUM ('subscription_payment', 'credit_purchase', 'refund');
CREATE TYPE "BillingTransactionStatus" AS ENUM ('paid', 'refunded', 'failed');

-- CreateTable
CREATE TABLE "billing_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "BillingTransactionType" NOT NULL,
    "status" "BillingTransactionStatus" NOT NULL DEFAULT 'paid',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "creditsGranted" INTEGER,
    "plan" "UserPlan",
    "provider" TEXT NOT NULL DEFAULT 'lemonsqueezy',
    "providerEventId" TEXT,
    "providerOrderId" TEXT,
    "providerInvoiceId" TEXT,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_transactions_providerEventId_key" ON "billing_transactions"("providerEventId");
CREATE INDEX "billing_transactions_userId_occurredAt_idx" ON "billing_transactions"("userId", "occurredAt");

ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
