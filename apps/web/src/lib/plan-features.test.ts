import { describe, expect, it } from "vitest";
import {
  newlyUnlockedFeatures,
  unlockTourIdForPlan,
} from "@/lib/plan-features";

describe("plan-features", () => {
  it("returns no plan-feature unlocks from free to pro (credits differ only)", () => {
    expect(newlyUnlockedFeatures("free", "pro")).toEqual([]);
  });

  it("detects agency-only unlocks from pro", () => {
    expect(newlyUnlockedFeatures("pro", "agency").sort()).toEqual(
      ["approval_share_links", "client_workspaces"].sort(),
    );
  });

  it("returns no feature unlocks for free to starter", () => {
    expect(newlyUnlockedFeatures("free", "starter")).toEqual([]);
  });

  it("maps unlock tour ids", () => {
    expect(unlockTourIdForPlan("pro")).toBe("pro-unlock-v1");
    expect(unlockTourIdForPlan("agency")).toBe("agency-unlock-v1");
    expect(unlockTourIdForPlan("starter")).toBeNull();
  });
});
