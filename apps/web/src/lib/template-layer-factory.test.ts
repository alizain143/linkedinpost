import { describe, expect, it } from "vitest";
import {
  canAddLayerType,
  createAvatarLayer,
  createLayer,
  createVisualZoneLayer,
  hasVisualZone,
} from "./template-layer-factory";
import type { TemplateElement } from "@/lib/api/types/media-template";

describe("template-layer-factory", () => {
  it("creates avatar layer bound to profile.avatar", () => {
    const layer = createAvatarLayer(1080, 1080, []);
    expect(layer.type).toBe("avatar");
    if (layer.type !== "avatar") return;
    expect(layer.bind).toBe("profile.avatar");
    expect(layer.size).toBe(48);
  });

  it("allows only one visual zone", () => {
    const existing: TemplateElement[] = [createVisualZoneLayer(1080, 1080, [])];
    expect(hasVisualZone(existing)).toBe(true);
    expect(canAddLayerType("visual_zone", existing)).toBe(false);
    expect(canAddLayerType("avatar", existing)).toBe(true);
  });

  it("allows only one avatar, headline, and subhead", () => {
    const avatar = createAvatarLayer(1080, 1080, []);
    const withAvatar: TemplateElement[] = [avatar];
    expect(canAddLayerType("avatar", withAvatar)).toBe(false);
    expect(canAddLayerType("text", withAvatar)).toBe(true);

    const headline = createLayer("post_headline", 1080, 1080, []);
    expect(canAddLayerType("post_headline", [headline])).toBe(false);

    const subhead = createLayer("post_subhead", 1080, 1080, []);
    expect(canAddLayerType("post_subhead", [subhead])).toBe(false);
  });

  it("creates layers with unique ids", () => {
    const first = createLayer("text", 1080, 1080, []);
    const second = createLayer("text", 1080, 1080, [first]);
    expect(first.id).not.toBe(second.id);
  });
});
