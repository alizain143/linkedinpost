import type { PostMediaType } from "@/lib/api/types/enums";

export const MEDIA_TYPE_OPTIONS: Array<{
  value: PostMediaType;
  label: string;
  description: string;
}> = [
  {
    value: "branded_quote_card",
    label: "Branded quote card",
    description: "Name, title, quote, and CTA footer",
  },
  {
    value: "stat_highlight",
    label: "Stat highlight",
    description: "Big number with supporting line",
  },
  {
    value: "tip_card",
    label: "Tip card",
    description: "3–5 bullet tips from your post",
  },
  {
    value: "infographic",
    label: "Infographic",
    description: "AI visual summary",
  },
  {
    value: "photo_illustration",
    label: "Photo illustration",
    description: "Mood image inspired by references",
  },
  {
    value: "quote_card",
    label: "Classic quote card",
    description: "AI-rendered quote (legacy)",
  },
];

export const MEDIA_TEMPLATE_OPTIONS = [
  { value: "linkedin_educational", label: "Educational infographic" },
  { value: "linkedin_quote_light", label: "Quote card (light)" },
  { value: "linkedin_quote_dark", label: "Quote card (dark)" },
  { value: "linkedin_tips", label: "Tips list" },
  { value: "linkedin_stat", label: "Stat highlight" },
] as const;
