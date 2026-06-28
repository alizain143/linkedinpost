import type { CreatePostBody } from "@/lib/api/types/post";
import type { QuickDraftVariant } from "@/lib/api/types/generation";

export function countWords(...parts: Array<string | null | undefined>): number {
  const text = parts.filter(Boolean).join(" ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export type VariantFormContext = {
  topic: string;
  contentProfileId?: string;
};

export function variantToCreatePostBody(
  variant: QuickDraftVariant,
  form: VariantFormContext,
): CreatePostBody {
  return {
    hook: variant.hook,
    body: variant.body,
    cta: variant.cta,
    tags: variant.tags,
    topic: form.topic.trim() || undefined,
    postType: variant.postType,
    tone: variant.tone || undefined,
    pillar: variant.pillar || undefined,
    contentProfileId: form.contentProfileId,
  };
}
