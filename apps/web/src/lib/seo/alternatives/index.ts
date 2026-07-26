import type { AlternativePage } from "../comparisons/types";
import { AUTHOREDUP_ALTERNATIVE } from "./authoredup";
import { BUFFER_ALTERNATIVE } from "./buffer";
import { TAPLIO_ALTERNATIVE } from "./taplio";

export const ALTERNATIVE_PAGES: AlternativePage[] = [
  TAPLIO_ALTERNATIVE,
  BUFFER_ALTERNATIVE,
  AUTHOREDUP_ALTERNATIVE,
];

export function getAlternativeBySlug(
  slug: string,
): AlternativePage | undefined {
  return ALTERNATIVE_PAGES.find((page) => page.slug === slug);
}

export { AUTHOREDUP_ALTERNATIVE, BUFFER_ALTERNATIVE, TAPLIO_ALTERNATIVE };
