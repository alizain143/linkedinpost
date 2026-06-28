import { describe, expect, it } from "vitest";
import { getCreditUsageDisplay } from "@/lib/credit-usage";

describe("getCreditUsageDisplay", () => {
  it("computes exact usage percent for partial usage", () => {
    const usage = getCreditUsageDisplay({ used: 84, limit: 1000, remaining: 916 });

    expect(usage.usagePercent).toBeCloseTo(8.4, 5);
    expect(usage.usagePercentLabel).toBe("8.4");
  });

  it("rounds whole percents at boundaries", () => {
    expect(getCreditUsageDisplay({ used: 0, limit: 1000, remaining: 1000 }).usagePercentLabel).toBe("0");
    expect(getCreditUsageDisplay({ used: 1000, limit: 1000, remaining: 0 }).usagePercentLabel).toBe("100");
  });
});
