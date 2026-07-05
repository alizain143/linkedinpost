import type { TemplateElement } from "@/lib/api/types/media-template";
import { clampElement } from "@/lib/template-layout-bounds";

export type AddableLayerType =
  | "text"
  | "avatar"
  | "visual_zone"
  | "post_headline"
  | "post_subhead";

/** Layer types that may appear at most once per template. */
const SINGLETON_LAYER_TYPES = new Set<TemplateElement["type"]>([
  "avatar",
  "visual_zone",
  "post_headline",
  "post_subhead",
]);

export const ADDABLE_LAYER_OPTIONS: {
  type: AddableLayerType;
  label: string;
}[] = [
  { type: "text", label: "Text" },
  { type: "avatar", label: "Avatar" },
  { type: "visual_zone", label: "Visual zone" },
  { type: "post_headline", label: "Headline" },
  { type: "post_subhead", label: "Subhead" },
];

export function uniqueLayerId(
  prefix: string,
  existingIds: Iterable<string>,
): string {
  const used = new Set(existingIds);
  let index = 1;
  while (used.has(`${prefix}_${index}`)) {
    index += 1;
  }
  return `${prefix}_${index}`;
}

export function hasVisualZone(elements: TemplateElement[]): boolean {
  return elements.some((element) => element.type === "visual_zone");
}

export function hasLayerType(
  elements: TemplateElement[],
  type: TemplateElement["type"],
): boolean {
  return elements.some((element) => element.type === type);
}

export function canAddLayerType(
  type: AddableLayerType,
  elements: TemplateElement[],
): boolean {
  if (SINGLETON_LAYER_TYPES.has(type) && hasLayerType(elements, type)) {
    return false;
  }
  return true;
}

export function addLayerTypeLabel(type: AddableLayerType): string {
  const option = ADDABLE_LAYER_OPTIONS.find((entry) => entry.type === type);
  return option?.label.toLowerCase() ?? type;
}

export function createLayer(
  type: AddableLayerType,
  canvasW: number,
  canvasH: number,
  elements: TemplateElement[],
): TemplateElement {
  const existingIds = elements.map((element) => element.id);

  switch (type) {
    case "text":
      return createTextLayer(canvasW, canvasH, existingIds);
    case "avatar":
      return createAvatarLayer(canvasW, canvasH, existingIds);
    case "visual_zone":
      return createVisualZoneLayer(canvasW, canvasH, existingIds);
    case "post_headline":
      return createPostHeadlineLayer(canvasW, canvasH, existingIds);
    case "post_subhead":
      return createPostSubheadLayer(canvasW, canvasH, existingIds);
  }
}

export function createTextLayer(
  canvasW: number,
  canvasH: number,
  existingIds: Iterable<string>,
): TemplateElement {
  const el: TemplateElement = {
    id: uniqueLayerId("text", existingIds),
    type: "text",
    x: Math.round(canvasW * 0.1),
    y: Math.round(canvasH * 0.1),
    w: Math.round(canvasW * 0.8),
    bind: "static",
    value: "New text",
    style: {
      fontFamily: "Inter",
      fontSize: 24,
      fontWeight: 400,
      color: "#0A0A0A",
      align: "left",
      lineHeight: 1.2,
    },
  };

  return clampElement(el, canvasW, canvasH);
}

export function createAvatarLayer(
  canvasW: number,
  canvasH: number,
  existingIds: Iterable<string>,
): TemplateElement {
  const el: TemplateElement = {
    id: uniqueLayerId("avatar", existingIds),
    type: "avatar",
    x: 64,
    y: 56,
    size: 48,
    bind: "profile.avatar",
  };

  return clampElement(el, canvasW, canvasH);
}

export function createVisualZoneLayer(
  canvasW: number,
  canvasH: number,
  existingIds: Iterable<string>,
): TemplateElement {
  const el: TemplateElement = {
    id: uniqueLayerId("visual", existingIds),
    type: "visual_zone",
    x: Math.round(canvasW * 0.08),
    y: Math.round(canvasH * 0.4),
    w: Math.round(canvasW * 0.84),
    h: Math.round(canvasH * 0.46),
  };

  return clampElement(el, canvasW, canvasH);
}

export function createPostHeadlineLayer(
  canvasW: number,
  canvasH: number,
  existingIds: Iterable<string>,
): TemplateElement {
  const el: TemplateElement = {
    id: uniqueLayerId("headline", existingIds),
    type: "post_headline",
    x: Math.round(canvasW * 0.08),
    y: Math.round(canvasH * 0.15),
    w: Math.round(canvasW * 0.84),
    style: {
      fontFamily: "Inter",
      fontSize: 48,
      fontWeight: 800,
      color: "#0A0A0A",
      align: "center",
      lineHeight: 1.15,
      highlightColor: "#0056D2",
    },
  };

  return clampElement(el, canvasW, canvasH);
}

export function createPostSubheadLayer(
  canvasW: number,
  canvasH: number,
  existingIds: Iterable<string>,
): TemplateElement {
  const el: TemplateElement = {
    id: uniqueLayerId("subhead", existingIds),
    type: "post_subhead",
    x: Math.round(canvasW * 0.11),
    y: Math.round(canvasH * 0.32),
    w: Math.round(canvasW * 0.78),
    style: {
      fontFamily: "Inter",
      fontSize: 26,
      fontWeight: 400,
      color: "#3F3F46",
      align: "center",
      lineHeight: 1.35,
    },
  };

  return clampElement(el, canvasW, canvasH);
}

