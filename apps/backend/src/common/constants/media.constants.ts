export const POST_MEDIA_MIME_TYPES = ['image/png', 'image/jpeg'] as const;
export const POST_MEDIA_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const POST_MEDIA_DEFAULT_WIDTH = 1200;
export const POST_MEDIA_DEFAULT_HEIGHT = 630;
/** Standalone freestyle image generation and in-council media regen. */
export const MEDIA_GENERATION_CREDIT_COST = 2;
/** Template-lane media (slot-fill + SVG render). */
export const MEDIA_TEMPLATE_CREDIT_COST = 1;
/** Per-slide cost for template or freestyle carousel generation. */
export const MEDIA_CAROUSEL_CREDIT_PER_SLIDE = 2;
export const CAROUSEL_MIN_SLIDES = 3;
export const CAROUSEL_MAX_SLIDES = 10;
/** User uploads: 1 = single; 2–10 = carousel (LinkedIn multiImage allows 2+). */
export const UPLOADED_MEDIA_MIN_FILES = 1;
export const UPLOADED_MEDIA_MAX_FILES = CAROUSEL_MAX_SLIDES;
export const POST_MEDIA_UPLOAD_TTL_SECONDS = 15 * 60;
export const POST_MEDIA_PENDING_MAX_AGE_MS = 2 * 60 * 60 * 1000;
/** Default slide estimate when AI decides carousel length (credit pre-auth). */
export const CAROUSEL_DEFAULT_SLIDE_ESTIMATE = 7;
/** Max length for user image direction prompts (generate-media, council, post patch). */
export const MEDIA_CUSTOM_PROMPT_MAX_LENGTH = 5000;
/** @deprecated Use MEDIA_GENERATION_CREDIT_COST */
export const MEDIA_REGEN_CREDIT_COST = MEDIA_GENERATION_CREDIT_COST;

export function extensionForPostMediaMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }
  return 'png';
}
