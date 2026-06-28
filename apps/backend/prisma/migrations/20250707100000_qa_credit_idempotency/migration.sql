-- Credit charge idempotency per generation job + transaction type
CREATE UNIQUE INDEX "credit_transactions_job_type_unique"
  ON "credit_transactions" ("generationJobId", "type")
  WHERE "generationJobId" IS NOT NULL;
