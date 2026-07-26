import type { ComparisonPage } from "./types";
import { AUTHOREDUP_COMPARISON } from "./authoredup";
import { BUFFER_COMPARISON } from "./buffer";
import { TAPLIO_COMPARISON } from "./taplio";

export type { ComparisonPage, ComparisonSlug, AlternativePage } from "./types";

export const COMPARISON_PAGES: ComparisonPage[] = [
  TAPLIO_COMPARISON,
  BUFFER_COMPARISON,
  AUTHOREDUP_COMPARISON,
];

export function getComparisonBySlug(slug: string): ComparisonPage | undefined {
  return COMPARISON_PAGES.find((page) => page.slug === slug);
}

export {
  AUTHOREDUP_COMPARISON,
  BUFFER_COMPARISON,
  TAPLIO_COMPARISON,
};
