import type { ApiPostPackage, ApiPostVersion } from "@/lib/api/types/post";

export function versionMatchesPost(
  version: ApiPostVersion,
  post: ApiPostPackage,
): boolean {
  const tagsMatch =
    version.tags.length === post.tags.length &&
    version.tags.every((tag, index) => tag === post.tags[index]);

  return (
    (version.hook ?? "") === post.hook &&
    (version.body ?? "") === (post.body ?? "") &&
    (version.cta ?? "") === (post.cta ?? "") &&
    tagsMatch
  );
}
