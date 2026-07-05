import { MediaTemplateLayout, TemplateElement } from './layout.types';

const MIN_VISUAL_ZONE_SIZE = 64;
const MIN_AVATAR_SIZE = 16;
const MIN_TEXT_WIDTH = 32;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampBox(
  x: number,
  y: number,
  w: number,
  h: number,
  canvasW: number,
  canvasH: number,
  minW = 1,
  minH = 1,
): { x: number; y: number; w: number; h: number } {
  const width = clamp(w, minW, canvasW);
  const height = clamp(h, minH, canvasH);
  const maxX = Math.max(0, canvasW - width);
  const maxY = Math.max(0, canvasH - height);

  return {
    x: clamp(x, 0, maxX),
    y: clamp(y, 0, maxY),
    w: width,
    h: height,
  };
}

export function clampElement(
  el: TemplateElement,
  canvasW: number,
  canvasH: number,
): TemplateElement {
  switch (el.type) {
    case 'avatar': {
      const size = clamp(el.size, MIN_AVATAR_SIZE, Math.min(canvasW, canvasH));
      const maxX = Math.max(0, canvasW - size);
      const maxY = Math.max(0, canvasH - size);
      return {
        ...el,
        x: clamp(el.x, 0, maxX),
        y: clamp(el.y, 0, maxY),
        size,
      };
    }
    case 'visual_zone': {
      const box = clampBox(
        el.x,
        el.y,
        el.w,
        el.h,
        canvasW,
        canvasH,
        MIN_VISUAL_ZONE_SIZE,
        MIN_VISUAL_ZONE_SIZE,
      );
      return { ...el, ...box };
    }
    case 'text':
    case 'post_headline':
    case 'post_subhead': {
      const box = clampBox(
        el.x,
        el.y,
        el.w,
        el.style.fontSize * (el.style.lineHeight ?? 1.2),
        canvasW,
        canvasH,
        MIN_TEXT_WIDTH,
        1,
      );
      return { ...el, x: box.x, y: box.y, w: box.w };
    }
    case 'rect': {
      const box = clampBox(el.x, el.y, el.w, el.h, canvasW, canvasH);
      return { ...el, ...box };
    }
    case 'carousel_nav': {
      const box = clampBox(
        el.x,
        el.y,
        el.style.fontSize * 8,
        el.style.fontSize * (el.style.lineHeight ?? 1.2),
        canvasW,
        canvasH,
        MIN_TEXT_WIDTH,
        1,
      );
      return { ...el, x: box.x, y: box.y };
    }
    default:
      return el;
  }
}

export function clampLayout(
  layout: MediaTemplateLayout,
  canvasW: number,
  canvasH: number,
): MediaTemplateLayout {
  return {
    ...layout,
    elements: layout.elements.map((el) => clampElement(el, canvasW, canvasH)),
  };
}
