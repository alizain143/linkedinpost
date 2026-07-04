import {
  MediaTemplateLayout,
  TemplateElement,
  TextStyle,
} from './layout.types';

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
    default:
      return null;
  }
}

export function parseMediaTemplateLayout(raw: unknown): MediaTemplateLayout {
  if (!isRecord(raw)) {
    throw new Error('Layout must be an object');
  }

  const background = isRecord(raw.background)
    ? { color: String(raw.background.color ?? '#FFFFFF') }
    : { color: '#FFFFFF' };

  const elementsRaw = Array.isArray(raw.elements) ? raw.elements : [];
  const elements = elementsRaw
    .map(parseElement)
    .filter((el): el is TemplateElement => el !== null);

  if (elements.length === 0) {
    throw new Error('Layout must include at least one element');
  }

  return {
    version: 1,
    background,
    elements,
  };
}
