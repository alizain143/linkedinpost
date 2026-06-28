import type { PostSource } from "@/lib/api/types/enums";

const POST_SOURCE_LABELS: Record<PostSource, string> = {
  manual: "Manual",
  generation: "Generation",
  calendar: "Calendar",
  autopilot: "Autopilot",
};

export function getPostSourceLabel(source: PostSource): string {
  return POST_SOURCE_LABELS[source] ?? source;
}
