const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

/** First origin from FRONTEND_URL (supports comma-separated CORS list). */
export function primaryFrontendUrl(
  frontendUrl = process.env.FRONTEND_URL,
  fallback = DEFAULT_FRONTEND_URL,
): string {
  const raw = frontendUrl?.trim() || fallback;
  return raw.split(',')[0]?.trim() || fallback;
}

/** All origins from FRONTEND_URL for CORS. */
export function frontendUrlOrigins(
  frontendUrl = process.env.FRONTEND_URL,
  fallback = DEFAULT_FRONTEND_URL,
): string[] {
  const raw = frontendUrl?.trim() || fallback;
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : [fallback];
}
