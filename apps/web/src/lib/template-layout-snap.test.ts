import { describe, expect, it } from "vitest";
import { computeSnap } from "./template-layout-snap";
import type { TemplateElement } from "@/lib/api/types/media-template";

const rect = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
): TemplateElement => ({
  id,
  type: "rect",
  x,
  y,
  w,
  h,
  fill: "#000",
});

describe("template-layout-snap", () => {
  it("snaps element center to canvas center", () => {
    const elements = [rect("a", 100, 100, 200, 100)];
    const result = computeSnap(
      { x: 444, y: 494, w: 200, h: 100 },
      1080,
      1080,
      elements,
      "moving",
    );

    expect(result.x).toBe(440);
    expect(result.y).toBe(490);
    expect(result.guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orientation: "vertical", position: 540 }),
        expect.objectContaining({ orientation: "horizontal", position: 540 }),
      ]),
    );
  });

  it("snaps left edge to another element left edge", () => {
    const elements = [rect("other", 120, 200, 300, 80)];
    const result = computeSnap(
      { x: 125, y: 400, w: 200, h: 100 },
      1080,
      1080,
      elements,
      "moving",
    );

    expect(result.x).toBe(120);
    expect(result.guides).toEqual([
      expect.objectContaining({ orientation: "vertical", position: 120 }),
    ]);
  });

  it("returns no guides when nothing is within threshold", () => {
    const elements = [rect("other", 0, 0, 100, 100)];
    const result = computeSnap(
      { x: 500, y: 500, w: 100, h: 100 },
      1080,
      1080,
      elements,
      "moving",
    );

    expect(result.x).toBe(500);
    expect(result.y).toBe(500);
    expect(result.guides).toEqual([]);
  });
});
