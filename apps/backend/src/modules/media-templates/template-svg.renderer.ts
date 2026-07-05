import {
  MediaTemplateLayout,
  TemplateBindContext,
  TemplateElement,
  TextStyle,
} from './layout.types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveTextBind(
  bind: string,
  value: string | undefined,
  ctx: TemplateBindContext,
): string {
  switch (bind) {
    case 'profile.name':
      return ctx.profileName;
    case 'profile.roleTitle':
      return ctx.roleTitle;
    case 'profile.currentCompany':
      return ctx.currentCompany;
    case 'profile.industry':
      return ctx.industry;
    case 'static':
    default:
      return value ?? '';
  }
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function estimateCharsPerLine(width: number, fontSize: number): number {
  return Math.max(8, Math.floor(width / (fontSize * 0.55)));
}

function renderTextBlock(
  text: string,
  x: number,
  y: number,
  w: number,
  style: TextStyle,
  highlight?: string,
): string {
  const fontSize = style.fontSize;
  const lineHeight = (style.lineHeight ?? 1.2) * fontSize;
  const align = style.align ?? 'left';
  const anchor =
    align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const textX =
    align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
  const maxChars = estimateCharsPerLine(w, fontSize);
  const lines = wrapLines(text, maxChars);
  const highlightColor = style.highlightColor ?? '#0056D2';
  const highlightTrim = highlight?.trim();

  return lines
    .map((line, index) => {
      const lineY = y + fontSize + index * lineHeight;
      if (highlightTrim && line.includes(highlightTrim)) {
        const parts = line.split(highlightTrim);
        let cursor = '';
        const spans: string[] = [];
        parts.forEach((part, partIndex) => {
          if (part) {
            spans.push(
              `<tspan fill="${escapeXml(style.color)}">${escapeXml(part)}</tspan>`,
            );
            cursor += part;
          }
          if (partIndex < parts.length - 1) {
            spans.push(
              `<tspan fill="${escapeXml(highlightColor)}">${escapeXml(highlightTrim)}</tspan>`,
            );
            cursor += highlightTrim;
          }
        });
        void cursor;
        return `<text x="${textX}" y="${lineY}" text-anchor="${anchor}" font-family="${escapeXml(style.fontFamily ?? 'Inter, Arial, sans-serif')}" font-size="${fontSize}" font-weight="${style.fontWeight ?? 400}">${spans.join('')}</text>`;
      }

      return `<text x="${textX}" y="${lineY}" text-anchor="${anchor}" font-family="${escapeXml(style.fontFamily ?? 'Inter, Arial, sans-serif')}" font-size="${fontSize}" font-weight="${style.fontWeight ?? 400}" fill="${escapeXml(style.color)}">${escapeXml(line)}</text>`;
    })
    .join('\n');
}

function renderAvatar(
  el: Extract<TemplateElement, { type: 'avatar' }>,
  ctx: TemplateBindContext,
): string {
  const cx = el.x + el.size / 2;
  const cy = el.y + el.size / 2;
  const r = el.size / 2;
  const clipId = `clip-${el.id}`;

  if (ctx.avatarUrl?.startsWith('data:')) {
    return `
      <defs>
        <clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#E4E4E7" />
      <image href="${ctx.avatarUrl}" x="${el.x}" y="${el.y}" width="${el.size}" height="${el.size}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />
    `;
  }

  const initials = ctx.profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#E4E4E7" />
    <text x="${cx}" y="${cy + el.size * 0.12}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${el.size * 0.36}" font-weight="600" fill="#52525B">${escapeXml(initials || '?')}</text>
  `;
}

function renderElement(el: TemplateElement, ctx: TemplateBindContext): string {
  switch (el.type) {
    case 'rect':
      return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${el.radius ?? 0}" fill="${escapeXml(el.fill)}" opacity="${el.opacity ?? 1}" />`;
    case 'avatar':
      return renderAvatar(el, ctx);
    case 'text': {
      const text = resolveTextBind(el.bind, el.value, ctx);
      return renderTextBlock(text, el.x, el.y, el.w, el.style);
    }
    case 'post_headline':
      return renderTextBlock(
        ctx.slots.headline,
        el.x,
        el.y,
        el.w,
        el.style,
        ctx.slots.headlineHighlight,
      );
    case 'post_subhead':
      return renderTextBlock(
        ctx.slots.subhead ?? '',
        el.x,
        el.y,
        el.w,
        el.style,
      );
    case 'visual_zone': {
      const dataUrl = ctx.visualZoneImages?.[el.id];
      if (!dataUrl) {
        return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="16" fill="#F4F4F5" />`;
      }
      const clipId = `vz-clip-${el.id}`;
      return `
      <defs>
        <clipPath id="${clipId}">
          <rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="16" />
        </clipPath>
      </defs>
      <image href="${dataUrl}" x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />
    `;
    }
    default:
      return '';
  }
}

export function renderTemplateSvg(
  layout: MediaTemplateLayout,
  width: number,
  height: number,
  ctx: TemplateBindContext,
): string {
  const body = layout.elements.map((el) => renderElement(el, ctx)).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${escapeXml(layout.background.color)}" />
  ${body}
</svg>`;
}
