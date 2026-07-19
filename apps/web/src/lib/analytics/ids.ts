/** Public GA4 ID; override with NEXT_PUBLIC_GA_MEASUREMENT_ID if needed. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-ZG34TRGH9L";

/** Public Clarity project ID; override with NEXT_PUBLIC_CLARITY_PROJECT_ID if needed. */
export const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "xhsl8kcscj";
