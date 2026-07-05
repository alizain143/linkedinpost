export function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export const PROMPT_FIELD_LIMITS = {
  writingSample: 400,
  additionalContext: 600,
  brief: 600,
  offerDescription: 200,
  avoidWords: 150,
  postBodyPreview: 300,
  avoidVariantHook: 210,
  avoidVariantBody: 500,
  maxAvoidVariants: 8,
  maxPillars: 8,
} as const;
