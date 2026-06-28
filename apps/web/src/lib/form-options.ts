/** Shared select / form option lists */

export const TIMEZONE_OPTIONS = ["GMT-5 Eastern", "GMT-8 Pacific"] as const;

export const CONTENT_PROFILE_OPTIONS = [
  "Maya — Startup Founder",
  "Northbeam Studio",
  "Personal brand",
] as const;

export const CONTENT_PILLAR_OPTIONS = [
  "Founder lessons",
  "Industry takes",
  "How-to",
] as const;

export const GOAL_OPTIONS = [
  "Build authority",
  "Drive engagement",
  "Generate leads",
] as const;

export const AUTOPILOT_STRATEGY_FIELDS = [
  { label: "Primary goal", options: ["Build authority", "Drive leads", "Grow audience"], default: "Build authority" },
  { label: "Media preference", options: ["Text card + image", "Carousel", "Text only"], default: "Text card + image" },
] as const;

export const CONTACT_SUBJECT_OPTIONS = [
  "General question",
  "Billing & plans",
  "Agency & teams",
  "Partnership",
  "Press",
] as const;

export const TONE_ADJUSTMENT_OPTIONS = [
  "Keep current",
  "More casual",
  "More authoritative",
  "More vulnerable",
] as const;

export const POST_TYPE_OPTIONS = [
  "Personal story",
  "List post",
  "How-to",
  "Contrarian take",
  "Case study",
  "Hot take",
] as const;

export const TONE_OPTIONS = [
  "Bold & punchy",
  "Thoughtful",
  "Practical",
  "Inspirational",
  "Direct",
  "Conversational",
] as const;
