export const POST_MEDIA_MIME_TYPES = ['image/png', 'image/jpeg'] as const;
export const POST_MEDIA_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const POST_MEDIA_DEFAULT_WIDTH = 1200;
export const POST_MEDIA_DEFAULT_HEIGHT = 630;
/** Standalone image generation and in-council media regen. */
export const MEDIA_GENERATION_CREDIT_COST = 2;
/** @deprecated Use MEDIA_GENERATION_CREDIT_COST */
export const MEDIA_REGEN_CREDIT_COST = MEDIA_GENERATION_CREDIT_COST;
