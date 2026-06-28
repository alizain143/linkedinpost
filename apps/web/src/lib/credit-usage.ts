import type { ApiCreditsBalance } from "@/lib/api/types/credits";

export type CreditUsageInput = Pick<
  ApiCreditsBalance,
  "used" | "limit" | "remaining"
>;

export type CreditUsageDisplay = CreditUsageInput & {
  /** 0–100, suitable for progress bar width */
  usagePercent: number;
  /** e.g. "8.4" or "0" */
  usagePercentLabel: string;
};

export function getCreditUsageDisplay(
  balance: CreditUsageInput,
): CreditUsageDisplay {
  const { used, limit, remaining } = balance;
  const usagePercent =
    limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  const usagePercentLabel =
    usagePercent > 0 && usagePercent < 100
      ? usagePercent.toFixed(1)
      : String(Math.round(usagePercent));

  return {
    used,
    limit,
    remaining,
    usagePercent,
    usagePercentLabel,
  };
}
