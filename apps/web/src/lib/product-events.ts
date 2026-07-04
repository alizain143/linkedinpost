export type ProductEventName =
  | "topic_suggestions_regenerated"
  | "variant_rejected"
  | "variant_regenerated"
  | "variant_copied"
  | "changes_auto_applied"
  | "changes_apply_manual"
  | "media_generated_with_prompt"
  | "council_text_regenerated"
  | "council_media_regenerated"
  | "council_post_rejected";

export function trackProductEvent(
  name: ProductEventName,
  props?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[product-event]", name, props ?? {});
  }
}
