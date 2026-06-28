import type { PostMediaType } from "@/lib/api/types/enums";

export type MediaTemplateId =
  | "linkedin_educational"
  | "linkedin_quote_light"
  | "linkedin_quote_dark"
  | "linkedin_tips"
  | "linkedin_stat";

export type MediaTemplateDefinition = {
  id: MediaTemplateId;
  label: string;
  description: string;
  mediaType: PostMediaType;
  preview: {
    bg: string;
    accent: string;
    text: string;
  };
};

export const MEDIA_TEMPLATE_CATALOG: MediaTemplateDefinition[] = [
  {
    id: "linkedin_educational",
    label: "Educational infographic",
    description:
      "Header, bold headline with accent, subline, 3-step flow, footer tags + CTA",
    mediaType: "branded_quote_card",
    preview: { bg: "#f4f4ef", accent: "#2563eb", text: "#1e293b" },
  },
  {
    id: "linkedin_quote_light",
    label: "Quote card (light)",
    description: "Clean light card with quote and Save & Repost footer",
    mediaType: "branded_quote_card",
    preview: { bg: "#fafaf8", accent: "#5B3DF5", text: "#0f172a" },
  },
  {
    id: "linkedin_quote_dark",
    label: "Quote card (dark)",
    description: "Bold gradient card with centered quote",
    mediaType: "branded_quote_card",
    preview: { bg: "#1a1a2e", accent: "#5B3DF5", text: "#ffffff" },
  },
  {
    id: "linkedin_tips",
    label: "Tips list",
    description: "Numbered tips with branded header",
    mediaType: "tip_card",
    preview: { bg: "#111827", accent: "#5B3DF5", text: "#f8fafc" },
  },
  {
    id: "linkedin_stat",
    label: "Stat highlight",
    description: "Big number with supporting context",
    mediaType: "stat_highlight",
    preview: { bg: "#0f172a", accent: "#0ea5e9", text: "#ffffff" },
  },
];

export function getTemplateDefinition(
  templateId?: string | null,
): MediaTemplateDefinition | undefined {
  return MEDIA_TEMPLATE_CATALOG.find((template) => template.id === templateId);
}

export function isCatalogTemplateId(
  templateId?: string | null,
): templateId is MediaTemplateId {
  return MEDIA_TEMPLATE_CATALOG.some((template) => template.id === templateId);
}

export const DEFAULT_MEDIA_TEMPLATE_ID: MediaTemplateId = "linkedin_educational";
