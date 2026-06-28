import { describe, expect, it } from "vitest";
import {
  formatNotificationTime,
  getNotificationIcon,
  parseNotificationActionPath,
  parseNotificationFilter,
} from "@/lib/notification-utils";

describe("notification-utils", () => {
  it("maps notification types to icons", () => {
    expect(getNotificationIcon("generation_complete")).toBe("auto_awesome");
    expect(getNotificationIcon("publish_failed")).toBe("error");
  });

  it("formats relative notification time", () => {
    const recent = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatNotificationTime(recent)).toBe("5m ago");
  });

  it("parses internal action paths", () => {
    expect(parseNotificationActionPath("/app/approvals")).toBe("/app/approvals");
    expect(
      parseNotificationActionPath("http://localhost:3000/app/posts/abc"),
    ).toBe("/app/posts/abc");
    expect(parseNotificationActionPath("https://evil.com/phish")).toBeNull();
    expect(parseNotificationActionPath(null)).toBeNull();
  });

  it("parses notification filter from URL", () => {
    expect(parseNotificationFilter("unread")).toBe("unread");
    expect(parseNotificationFilter("all")).toBe("all");
    expect(parseNotificationFilter(undefined)).toBe("all");
  });
});
