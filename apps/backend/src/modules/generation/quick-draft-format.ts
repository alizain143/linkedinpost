export const QUICK_DRAFT_VARIANT_FORMATS = [
  'concise',
  'detailed',
  'pattern_interrupt',
] as const;

export type QuickDraftVariantFormat =
  (typeof QUICK_DRAFT_VARIANT_FORMATS)[number];

export function isQuickDraftVariantFormat(
  value: unknown,
): value is QuickDraftVariantFormat {
  return (
    typeof value === 'string' &&
    (QUICK_DRAFT_VARIANT_FORMATS as readonly string[]).includes(value)
  );
}

export const QUICK_DRAFT_FORMAT_LABELS: Record<
  QuickDraftVariantFormat,
  string
> = {
  concise: 'Concise',
  detailed: 'Detailed',
  pattern_interrupt: 'Scroll-stopper',
};

export const QUICK_DRAFT_FORMAT_BODY_LIMITS: Record<
  QuickDraftVariantFormat,
  { min: number; max: number }
> = {
  concise: { min: 180, max: 500 },
  detailed: { min: 500, max: 1000 },
  pattern_interrupt: { min: 350, max: 750 },
};
