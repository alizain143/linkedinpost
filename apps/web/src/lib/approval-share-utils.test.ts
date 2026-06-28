import { describe, expect, it } from "vitest";
import {
  canUseApprovalShareLinks,
  formatApprovalLinkExpiry,
} from "@/lib/approval-share-utils";

describe("approval-share-utils", () => {
  it("allows approval share links only on agency plan", () => {
    expect(canUseApprovalShareLinks("agency")).toBe(true);
    expect(canUseApprovalShareLinks("pro")).toBe(false);
    expect(canUseApprovalShareLinks("free")).toBe(false);
  });

  it("formats approval link expiry dates", () => {
    const formatted = formatApprovalLinkExpiry("2026-07-11T00:00:00.000Z");
    expect(formatted).toMatch(/Jul/);
    expect(formatted).toMatch(/2026/);
  });
});
