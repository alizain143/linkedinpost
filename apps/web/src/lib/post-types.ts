import type { PostType } from "@/lib/api/types/enums";

const POST_TYPE_LABELS: Record<PostType, string> = {
  personal_story: "Personal story",
  list_post: "List post",
  how_to: "How-to",
  contrarian_take: "Contrarian take",
  hot_take: "Hot take",
  case_study: "Case study",
};

export function getPostTypeLabel(postType: PostType | null | undefined): string | null {
  if (!postType) return null;
  return POST_TYPE_LABELS[postType] ?? postType;
}

export const POST_TYPE_SELECT_OPTIONS: Array<{ value: PostType; label: string }> =
  (Object.entries(POST_TYPE_LABELS) as Array<[PostType, string]>).map(
    ([value, label]) => ({ value, label }),
  );

const POST_TYPE_LABEL_TO_VALUE = Object.fromEntries(
  Object.entries(POST_TYPE_LABELS).map(([value, label]) => [label, value]),
) as Record<string, PostType>;

export function postTypeFromLabel(label: string): PostType | undefined {
  return POST_TYPE_LABEL_TO_VALUE[label];
}
