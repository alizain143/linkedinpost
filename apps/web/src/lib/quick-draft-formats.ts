export const QUICK_DRAFT_VARIANT_FORMATS = [
  "concise",
  "detailed",
  "pattern_interrupt",
] as const;

export type QuickDraftVariantFormat =
  (typeof QUICK_DRAFT_VARIANT_FORMATS)[number];

export const QUICK_DRAFT_FORMAT_LABELS: Record<
  QuickDraftVariantFormat,
  string
> = {
  concise: "Concise",
  detailed: "Detailed",
  pattern_interrupt: "Scroll-stopper",
};

export function getQuickDraftFormatLabel(
  format: string | null | undefined,
): string | null {
  if (!format) return null;
  if (format in QUICK_DRAFT_FORMAT_LABELS) {
    return QUICK_DRAFT_FORMAT_LABELS[format as QuickDraftVariantFormat];
  }
  return format;
}
