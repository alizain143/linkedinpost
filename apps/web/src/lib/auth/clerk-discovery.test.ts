import { describe, expect, it } from "vitest";
import { frontendApiFromPublishableKey } from "@/lib/auth/clerk-discovery";

describe("frontendApiFromPublishableKey", () => {
  it("decodes pk_test_ keys", () => {
    // base64("example.accounts.dev$")
    const key = `pk_test_${Buffer.from("example.accounts.dev$").toString("base64")}`;
    expect(frontendApiFromPublishableKey(key)).toBe(
      "https://example.accounts.dev",
    );
  });

  it("returns null for invalid keys", () => {
    expect(frontendApiFromPublishableKey(undefined)).toBeNull();
    expect(frontendApiFromPublishableKey("not-a-key")).toBeNull();
  });
});
