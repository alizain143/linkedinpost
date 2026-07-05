import type { TemplateElement } from "@/lib/api/types/media-template";
import { getElementBounds, type ElementBounds } from "@/lib/template-layout-bounds";

export const SNAP_THRESHOLD_PX = 6;

export type SnapGuide = {
  orientation: "vertical" | "horizontal";
  position: number;
  /** Crosshair anchor on the guide line (y for vertical, x for horizontal). */
  crossAt: number;
};

export type SnapResult = {
  x: number;
  y: number;
  guides: SnapGuide[];
};

function collectAxisTargets(
  canvasW: number,
  canvasH: number,
  elements: TemplateElement[],
  excludeId: string,
): { x: number[]; y: number[] } {
  const xTargets = new Set<number>([canvasW / 2]);
  const yTargets = new Set<number>([canvasH / 2]);

  for (const el of elements) {
    if (el.id === excludeId) continue;
    const b = getElementBounds(el);
    xTargets.add(b.x);
    xTargets.add(b.x + b.w / 2);
    xTargets.add(b.x + b.w);
    yTargets.add(b.y);
    yTargets.add(b.y + b.h / 2);
    yTargets.add(b.y + b.h);
  }

  return { x: [...xTargets], y: [...yTargets] };
}

function findBestAxisSnap(
  edges: { value: number; adjust: (target: number) => number }[],
  targets: number[],
  threshold: number,
): { delta: number; guide: number } | null {
  let best: { delta: number; guide: number } | null = null;

  for (const target of targets) {
    for (const edge of edges) {
      const delta = edge.adjust(target);
      if (Math.abs(delta) > threshold) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta)) {
        best = { delta, guide: target };
      }
    }
  }

  return best;
}

export function computeSnap(
  bounds: ElementBounds,
  canvasW: number,
  canvasH: number,
  elements: TemplateElement[],
  excludeId: string,
  threshold = SNAP_THRESHOLD_PX,
): SnapResult {
  const { x: xTargets, y: yTargets } = collectAxisTargets(
    canvasW,
    canvasH,
    elements,
    excludeId,
  );

  const xSnap = findBestAxisSnap(
    [
      { value: bounds.x, adjust: (t) => t - bounds.x },
      { value: bounds.x + bounds.w / 2, adjust: (t) => t - (bounds.x + bounds.w / 2) },
      { value: bounds.x + bounds.w, adjust: (t) => t - (bounds.x + bounds.w) },
    ],
    xTargets,
    threshold,
  );

  const ySnap = findBestAxisSnap(
    [
      { value: bounds.y, adjust: (t) => t - bounds.y },
      { value: bounds.y + bounds.h / 2, adjust: (t) => t - (bounds.y + bounds.h / 2) },
      { value: bounds.y + bounds.h, adjust: (t) => t - (bounds.y + bounds.h) },
    ],
    yTargets,
    threshold,
  );

  const snappedX = xSnap ? bounds.x + xSnap.delta : bounds.x;
  const snappedY = ySnap ? bounds.y + ySnap.delta : bounds.y;
  const snappedBounds = {
    x: snappedX,
    y: snappedY,
    w: bounds.w,
    h: bounds.h,
  };

  const guides: SnapGuide[] = [];
  if (xSnap) {
    guides.push({
      orientation: "vertical",
      position: xSnap.guide,
      crossAt: snappedBounds.y + snappedBounds.h / 2,
    });
  }
  if (ySnap) {
    guides.push({
      orientation: "horizontal",
      position: ySnap.guide,
      crossAt: snappedBounds.x + snappedBounds.w / 2,
    });
  }

  return { x: snappedX, y: snappedY, guides };
}
