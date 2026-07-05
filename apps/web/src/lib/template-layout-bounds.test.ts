import { describe, expect, it } from "vitest";
import { clampElement } from "./template-layout-bounds";

describe("template-layout-bounds", () => {
  it("keeps visual_zone inside canvas", () => {
    const el = clampElement(
      {
        id: "visual",
        type: "visual_zone",
        x: -476,
        y: 444,
        w: 920,
        h: 500,
      },
      1080,
      1080,
    );

    expect(el.type).toBe("visual_zone");
    if (el.type !== "visual_zone") return;
    expect(el.x).toBeGreaterThanOrEqual(0);
    expect(el.y).toBeGreaterThanOrEqual(0);
    expect(el.x + el.w).toBeLessThanOrEqual(1080);
    expect(el.y + el.h).toBeLessThanOrEqual(1080);
  });

  it("clamps text width within canvas", () => {
    const el = clampElement(
      {
        id: "name",
        type: "text",
        x: 900,
        y: 40,
        w: 400,
        bind: "profile.name",
        style: {
          fontSize: 28,
          color: "#000000",
        },
      },
      1080,
      1080,
    );

    expect(el.type).toBe("text");
    if (el.type !== "text") return;
    expect(el.x + el.w).toBeLessThanOrEqual(1080);
  });
});
