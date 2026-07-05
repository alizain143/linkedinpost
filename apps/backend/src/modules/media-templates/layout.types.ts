import type { LayoutGradient } from './layout-gradient.util';

export type TextBind =
  | 'static'
  | 'profile.name'
  | 'profile.roleTitle'
  | 'profile.currentCompany'
  | 'profile.industry';

export type AvatarBind = 'profile.avatar';

export interface TextStyle {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  highlightColor?: string;
}

export interface TemplateTextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  w: number;
  bind: TextBind;
  value?: string;
  style: TextStyle;
}

export interface TemplateAvatarElement {
  id: string;
  type: 'avatar';
  x: number;
  y: number;
  size: number;
  bind: AvatarBind;
}

export interface TemplateRectElement {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  radius?: number;
  opacity?: number;
  gradient?: LayoutGradient;
}

export interface TemplateHeadlineElement {
  id: string;
  type: 'post_headline';
  x: number;
  y: number;
  w: number;
  style: TextStyle;
}

export interface TemplateSubheadElement {
  id: string;
  type: 'post_subhead';
  x: number;
  y: number;
  w: number;
  style: TextStyle;
}

export interface TemplateVisualZoneElement {
  id: string;
  type: 'visual_zone';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TemplateCarouselNavElement {
  id: string;
  type: 'carousel_nav';
  x: number;
  y: number;
  label: string;
  style: TextStyle;
}

export type TemplateElement =
  | TemplateTextElement
  | TemplateAvatarElement
  | TemplateRectElement
  | TemplateHeadlineElement
  | TemplateSubheadElement
  | TemplateVisualZoneElement
  | TemplateCarouselNavElement;

export interface MediaTemplateLayout {
  version: 1;
  background: { color: string; gradient?: LayoutGradient };
  elements: TemplateElement[];
}

export type CarouselPageRole = 'first' | 'middle' | 'last';

export interface CarouselMediaTemplateLayout {
  version: 2;
  kind: 'carousel';
  pages: {
    first: MediaTemplateLayout;
    middle: MediaTemplateLayout;
    last: MediaTemplateLayout;
  };
}

export type AnyMediaTemplateLayout =
  | MediaTemplateLayout
  | CarouselMediaTemplateLayout;

export function isCarouselLayout(
  layout: AnyMediaTemplateLayout,
): layout is CarouselMediaTemplateLayout {
  return (
    layout.version === 2 &&
    'kind' in layout &&
    layout.kind === 'carousel'
  );
}

export function getCarouselPageLayout(
  layout: CarouselMediaTemplateLayout,
  role: CarouselPageRole,
): MediaTemplateLayout {
  return layout.pages[role];
}

export interface TemplateSlotContent {
  headline: string;
  headlineHighlight?: string;
  subhead?: string;
  /** Image-model brief for visual_zone inset(s). */
  visualPrompt?: string;
  altText: string;
}

export interface CarouselSlideSlotContent extends TemplateSlotContent {
  role: CarouselPageRole;
}

export interface CarouselSlotFillResult {
  totalSlides: number;
  slides: CarouselSlideSlotContent[];
}

export interface TemplateBindContext {
  profileName: string;
  roleTitle: string;
  currentCompany: string;
  industry: string;
  avatarUrl?: string | null;
  brandPrimary?: string | null;
  brandAccent?: string | null;
  slots: TemplateSlotContent;
  /** zone element id → data URL (AI-generated inset) */
  visualZoneImages?: Record<string, string>;
}

export const SYSTEM_IDENTITY_CARD_PRESET_ID = 'system:identity-card';
export const SYSTEM_CAROUSEL_IDENTITY_PRESET_ID = 'system:carousel-identity';

export interface ResolvedMediaTemplate {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: AnyMediaTemplateLayout;
  isSystem: boolean;
  workspaceId: string | null;
}

export function isCarouselTemplate(
  template: ResolvedMediaTemplate,
): boolean {
  return (
    template.id === SYSTEM_CAROUSEL_IDENTITY_PRESET_ID ||
    isCarouselLayout(template.layout)
  );
}
