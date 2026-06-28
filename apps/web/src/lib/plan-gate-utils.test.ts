import { describe, expect, it } from "vitest";
import { getPlanGateState } from "@/lib/plan-gate-utils";

describe("plan-gate-utils", () => {
  it("returns loading before credits are available", () => {
    expect(
      getPlanGateState({ isLoading: true, isError: false, balance: undefined }),
    ).toEqual({ status: "loading", plan: null });
  });

  it("returns error when credits fail", () => {
    expect(
      getPlanGateState({ isLoading: false, isError: true, balance: undefined }),
    ).toEqual({ status: "error", plan: null });
  });

  it("returns ready plan when credits load", () => {
    expect(
      getPlanGateState({
        isLoading: false,
        isError: false,
        balance: {
          plan: "agency",
          periodStart: "2026-06-01T00:00:00.000Z",
          periodEnd: "2026-07-01T00:00:00.000Z",
          used: 100,
          limit: 1000,
          remaining: 900,
          percentUsed: 10,
        },
      }),
    ).toEqual({ status: "ready", plan: "agency" });
  });
});
