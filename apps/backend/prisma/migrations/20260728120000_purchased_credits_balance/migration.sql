-- Persist one-time purchased credits across upgrades and billing periods.
ALTER TABLE "users" ADD COLUMN "purchasedCreditsBalance" INTEGER NOT NULL DEFAULT 0;

-- Backfill: lifetime purchases minus usage beyond one period of the user's current plan limit.
UPDATE "users" AS u
SET "purchasedCreditsBalance" = GREATEST(
  0,
  COALESCE((
    SELECT SUM(ct.amount)
    FROM "credit_transactions" ct
    WHERE ct."userId" = u.id
      AND ct.type = 'purchase'
      AND ct.amount > 0
  ), 0)
  - GREATEST(
    0,
    COALESCE((
      SELECT SUM(-ct.amount)
      FROM "credit_transactions" ct
      WHERE ct."userId" = u.id
        AND ct.amount < 0
    ), 0)
    - CASE u.plan
        WHEN 'free' THEN 15
        WHEN 'starter' THEN 50
        WHEN 'pro' THEN 200
        WHEN 'agency' THEN 1000
        ELSE 15
      END
  )
);
