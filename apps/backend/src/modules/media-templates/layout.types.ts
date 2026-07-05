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

export type TemplateElement =
  | TemplateTextElement
  | TemplateAvatarElement
  | TemplateRectElement
  | TemplateHeadlineElement
  | TemplateSubheadElement
  | TemplateVisualZoneElement;

export interface MediaTemplateLayout {
  version: 1;
  background: { color: string };
  elements: TemplateElement[];
}

export interface TemplateSlotContent {
  headline: string;
  headlineHighlight?: string;
  subhead?: string;
  /** Image-model brief for visual_zone inset(s). */
  visualPrompt?: string;
  altText: string;
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

export interface ResolvedMediaTemplate {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
  isSystem: boolean;
  workspaceId: string | null;
}
