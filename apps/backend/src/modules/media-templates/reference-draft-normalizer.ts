import { clampLayout } from './layout-bounds.util';
import type { MediaTemplateLayout, TemplateElement } from './layout.types';

const IDENTITY_BINDS = new Set([
  'profile.name',
  'profile.roleTitle',
  'profile.currentCompany',
  'profile.industry',
]);

function elementLayerPriority(el: TemplateElement): number {
  switch (el.type) {
    case 'rect':
      return 0;
    case 'visual_zone':
      return 1;
    case 'avatar':
      return 2;
    case 'carousel_nav':
      return 3;
    case 'text':
    case 'post_headline':
    case 'post_subhead':
      return 4;
    default:
      return 5;
  }
}

function rectArea(el: TemplateElement): number {
  if (el.type !== 'rect') return 0;
  return el.w * el.h;
}

function isIdentityCornerLayout(elements: TemplateElement[]): boolean {
  const hasAvatar = elements.some((el) => el.type === 'avatar');
  const identityTextCount = elements.filter(
    (el) => el.type === 'text' && IDENTITY_BINDS.has(el.bind),
  ).length;
  const hasHeroVisual = elements.some((el) => el.type === 'visual_zone');
  return hasAvatar && identityTextCount >= 2 && !hasHeroVisual;
}

function stripMisplacedIdentityElements(
  layout: MediaTemplateLayout,
): MediaTemplateLayout {
  if (isIdentityCornerLayout(layout.elements)) {
    return layout;
  }

  return {
    ...layout,
    elements: layout.elements.filter((el) => {
      if (el.type === 'avatar') return false;
      if (el.type === 'text' && IDENTITY_BINDS.has(el.bind)) return false;
      return true;
    }),
  };
}

function sortElementsForPaintOrder(
  elements: TemplateElement[],
): TemplateElement[] {
  return [...elements].sort((a, b) => {
    const layerDiff = elementLayerPriority(a) - elementLayerPriority(b);
    if (layerDiff !== 0) return layerDiff;
    if (a.type === 'rect' && b.type === 'rect') {
      return rectArea(b) - rectArea(a);
    }
    return 0;
  });
}

/** Light-touch cleanup only — never inject preset structure over the model output. */
export function normalizeReferenceDraftLayout(
  layout: MediaTemplateLayout,
  canvasW: number,
  canvasH: number,
): MediaTemplateLayout {
  const stripped = stripMisplacedIdentityElements(layout);
  const clamped = clampLayout(stripped, canvasW, canvasH);
  return {
    ...clamped,
    elements: sortElementsForPaintOrder(clamped.elements),
  };
}
