import { PostMediaType } from '@prisma/client';

export type MediaTemplateId =
  | 'linkedin_educational'
  | 'linkedin_quote_light'
  | 'linkedin_quote_dark'
  | 'linkedin_tips'
  | 'linkedin_stat';

export interface MediaTemplateDefinition {
  id: MediaTemplateId;
  label: string;
  description: string;
  mediaType: PostMediaType;
  /** Light preview colors for UI */
  preview: {
    bg: string;
    accent: string;
    text: string;
  };
}

export const MEDIA_TEMPLATE_CATALOG: MediaTemplateDefinition[] = [
  {
    id: 'linkedin_educational',
    label: 'Educational infographic',
    description:
      'Name + title header, bold headline, subline, center flow visual, footer tags + CTA',
    mediaType: PostMediaType.branded_quote_card,
    preview: { bg: '#f4f4ef', accent: '#2563eb', text: '#1e293b' },
  },
  {
    id: 'linkedin_quote_light',
    label: 'Quote card (light)',
    description: 'Clean light card with quote and Save & Repost footer',
    mediaType: PostMediaType.branded_quote_card,
    preview: { bg: '#fafaf8', accent: '#5B3DF5', text: '#0f172a' },
  },
  {
    id: 'linkedin_quote_dark',
    label: 'Quote card (dark)',
    description: 'Bold gradient card with centered quote',
    mediaType: PostMediaType.branded_quote_card,
    preview: { bg: '#1a1a2e', accent: '#5B3DF5', text: '#ffffff' },
  },
  {
    id: 'linkedin_tips',
    label: 'Tips list',
    description: 'Numbered tips with branded header',
    mediaType: PostMediaType.tip_card,
    preview: { bg: '#f8fafc', accent: '#5B3DF5', text: '#0f172a' },
  },
  {
    id: 'linkedin_stat',
    label: 'Stat highlight',
    description: 'Big number with supporting context',
    mediaType: PostMediaType.stat_highlight,
    preview: { bg: '#f1f5f9', accent: '#0ea5e9', text: '#0f172a' },
  },
];

const CATALOG_IDS = new Set(
  MEDIA_TEMPLATE_CATALOG.map((template) => template.id),
);

export function isCatalogTemplateId(
  templateId?: string | null,
): templateId is MediaTemplateId {
  return Boolean(templateId && CATALOG_IDS.has(templateId as MediaTemplateId));
}

export function getTemplateDefinition(
  templateId?: string | null,
): MediaTemplateDefinition | undefined {
  if (!isCatalogTemplateId(templateId)) return undefined;
  return MEDIA_TEMPLATE_CATALOG.find((template) => template.id === templateId);
}

export function shouldUseTemplateRenderer(
  mediaType: PostMediaType,
  templateId?: string | null,
): boolean {
  if (isCatalogTemplateId(templateId)) return true;
  return [
    PostMediaType.branded_quote_card,
    PostMediaType.stat_highlight,
    PostMediaType.tip_card,
  ].includes(mediaType);
}

export function shouldSkipImageScout(templateId?: string | null): boolean {
  return isCatalogTemplateId(templateId);
}
