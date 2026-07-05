import {
  AnyMediaTemplateLayout,
  CarouselMediaTemplateLayout,
  MediaTemplateLayout,
  TemplateElement,
  TextStyle,
} from './layout.types';
import { clampLayout } from './layout-bounds.util';
import { parseLayoutGradient } from './layout-gradient.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseTextStyle(raw: unknown): TextStyle | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.fontSize !== 'number' || typeof raw.color !== 'string') {
    return null;
  }
  return {
    fontFamily:
      typeof raw.fontFamily === 'string' ? raw.fontFamily : 'Inter',
    fontSize: raw.fontSize,
    fontWeight:
      typeof raw.fontWeight === 'number' ? raw.fontWeight : 400,
    color: raw.color,
    align:
      raw.align === 'left' || raw.align === 'center' || raw.align === 'right'
        ? raw.align
        : 'left',
    lineHeight:
      typeof raw.lineHeight === 'number' ? raw.lineHeight : 1.2,
    highlightColor:
      typeof raw.highlightColor === 'string'
        ? raw.highlightColor
        : undefined,
  };
}

function parseElement(raw: unknown): TemplateElement | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.type !== 'string') {
    return null;
  }

  const x = typeof raw.x === 'number' ? raw.x : 0;
  const y = typeof raw.y === 'number' ? raw.y : 0;

  switch (raw.type) {
    case 'text': {
      const style = parseTextStyle(raw.style);
      if (!style || typeof raw.w !== 'number') return null;
      const bind =
        raw.bind === 'static' ||
        raw.bind === 'profile.name' ||
        raw.bind === 'profile.roleTitle' ||
        raw.bind === 'profile.currentCompany' ||
        raw.bind === 'profile.industry'
          ? raw.bind
          : 'static';
      return {
        id: raw.id,
        type: 'text',
        x,
        y,
        w: raw.w,
        bind,
        value: typeof raw.value === 'string' ? raw.value : undefined,
        style,
      };
    }
    case 'avatar': {
      if (typeof raw.size !== 'number') return null;
      return {
        id: raw.id,
        type: 'avatar',
        x,
        y,
        size: raw.size,
        bind: 'profile.avatar',
      };
    }
    case 'rect': {
      if (typeof raw.w !== 'number' || typeof raw.h !== 'number') return null;
      if (typeof raw.fill !== 'string') return null;
      return {
        id: raw.id,
        type: 'rect',
        x,
        y,
        w: raw.w,
        h: raw.h,
        fill: raw.fill,
        radius: typeof raw.radius === 'number' ? raw.radius : 0,
        opacity: typeof raw.opacity === 'number' ? raw.opacity : 1,
        gradient: parseLayoutGradient(raw.gradient),
      };
    }
    case 'post_headline':
    case 'post_subhead': {
      const style = parseTextStyle(raw.style);
      if (!style || typeof raw.w !== 'number') return null;
      return {
        id: raw.id,
        type: raw.type,
        x,
        y,
        w: raw.w,
        style,
      };
    }
    case 'visual_zone': {
      if (typeof raw.w !== 'number' || typeof raw.h !== 'number') return null;
      return {
        id: raw.id,
        type: 'visual_zone',
        x,
        y,
        w: raw.w,
        h: raw.h,
      };
    }
    case 'carousel_nav': {
      const style = parseTextStyle(raw.style);
      if (!style) return null;
      return {
        id: raw.id,
        type: 'carousel_nav',
        x,
        y,
        label: typeof raw.label === 'string' ? raw.label : 'Swipe →',
        style,
      };
    }
    default:
      return null;
  }
}

function validateSinglePageLayout(
  elements: TemplateElement[],
  label: string,
): void {
  if (elements.length === 0) {
    throw new Error(`${label} must include at least one element`);
  }
  const visualZoneCount = elements.filter(
    (element) => element.type === 'visual_zone',
  ).length;
  if (visualZoneCount > 1) {
    throw new Error(`${label} may include at most one visual_zone`);
  }
}

function parseSinglePageLayout(
  raw: unknown,
  canvas?: { width: number; height: number },
): MediaTemplateLayout {
  if (!isRecord(raw)) {
    throw new Error('Layout must be an object');
  }

  const background = isRecord(raw.background)
    ? {
        color: String(raw.background.color ?? '#FFFFFF'),
        gradient: parseLayoutGradient(raw.background.gradient),
      }
    : { color: '#FFFFFF' };

  const elementsRaw = Array.isArray(raw.elements) ? raw.elements : [];
  const elements = elementsRaw
    .map(parseElement)
    .filter((el): el is TemplateElement => el !== null);

  validateSinglePageLayout(elements, 'Layout');

  const layout: MediaTemplateLayout = {
    version: 1,
    background,
    elements,
  };

  if (canvas) {
    return clampLayout(layout, canvas.width, canvas.height);
  }

  return layout;
}

function parseCarouselLayout(
  raw: unknown,
  canvas?: { width: number; height: number },
): CarouselMediaTemplateLayout {
  if (!isRecord(raw) || !isRecord(raw.pages)) {
    throw new Error('Carousel layout must include pages');
  }

  const pages = raw.pages as Record<string, unknown>;
  const first = parseSinglePageLayout(pages.first, canvas);
  const middle = parseSinglePageLayout(pages.middle, canvas);
  const last = parseSinglePageLayout(pages.last, canvas);

  return {
    version: 2,
    kind: 'carousel',
    pages: { first, middle, last },
  };
}

export function parseMediaTemplateLayout(
  raw: unknown,
  canvas?: { width: number; height: number },
): MediaTemplateLayout {
  if (!isRecord(raw)) {
    throw new Error('Layout must be an object');
  }

  if (raw.version === 2 && raw.kind === 'carousel') {
    throw new Error(
      'Use parseAnyMediaTemplateLayout for carousel (version 2) layouts',
    );
  }

  return parseSinglePageLayout(raw, canvas);
}

export function parseAnyMediaTemplateLayout(
  raw: unknown,
  canvas?: { width: number; height: number },
): AnyMediaTemplateLayout {
  if (!isRecord(raw)) {
    throw new Error('Layout must be an object');
  }

  if (raw.version === 2 && raw.kind === 'carousel') {
    return parseCarouselLayout(raw, canvas);
  }

  return parseSinglePageLayout(raw, canvas);
}

export function clampAnyLayout(
  layout: AnyMediaTemplateLayout,
  canvasW: number,
  canvasH: number,
): AnyMediaTemplateLayout {
  if (layout.version === 2 && layout.kind === 'carousel') {
    return {
      ...layout,
      pages: {
        first: clampLayout(layout.pages.first, canvasW, canvasH),
        middle: clampLayout(layout.pages.middle, canvasW, canvasH),
        last: clampLayout(layout.pages.last, canvasW, canvasH),
      },
    };
  }

  return clampLayout(layout as MediaTemplateLayout, canvasW, canvasH);
}
