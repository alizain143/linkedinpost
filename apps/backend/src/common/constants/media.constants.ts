export const POST_MEDIA_MIME_TYPES = ['image/png', 'image/jpeg'] as const;
export const POST_MEDIA_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const POST_MEDIA_DEFAULT_WIDTH = 1200;
export const POST_MEDIA_DEFAULT_HEIGHT = 630;
/** Standalone freestyle image generation and in-council media regen. */
export const MEDIA_GENERATION_CREDIT_COST = 2;
/** Template-lane media (slot-fill + SVG render). */
export const MEDIA_TEMPLATE_CREDIT_COST = 1;
/** Max length for user image direction prompts (generate-media, council, post patch). */
export const MEDIA_CUSTOM_PROMPT_MAX_LENGTH = 5000;
/** @deprecated Use MEDIA_GENERATION_CREDIT_COST */
export const MEDIA_REGEN_CREDIT_COST = MEDIA_GENERATION_CREDIT_COST;
