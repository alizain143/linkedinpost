import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { toQueryError } from "@/lib/query-error-utils";

describe("query-error-utils", () => {
  it("returns null for empty errors", () => {
    expect(toQueryError(null)).toBeNull();
    expect(toQueryError(undefined)).toBeNull();
  });

  it("passes through Error instances", () => {
    const error = new Error("boom");
    expect(toQueryError(error)).toBe(error);
  });

  it("wraps ApiError instances", () => {
    const error = new ApiError("APPROVAL_LINK_INVALID", "invalid");
    expect(toQueryError(error)).toBe(error);
  });

  it("wraps string errors", () => {
    expect(toQueryError("network failed")?.message).toBe("network failed");
  });
});
