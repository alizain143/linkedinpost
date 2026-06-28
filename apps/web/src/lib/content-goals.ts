import type { ContentGoal } from "@/lib/api/types/enums";

export const CONTENT_GOAL_OPTIONS: ReadonlyArray<{
  value: ContentGoal;
  label: string;
}> = [
  { value: "build_authority", label: "Build authority" },
  { value: "generate_leads", label: "Generate leads" },
  { value: "grow_audience", label: "Grow audience" },
];

export function getContentGoalLabel(goal: ContentGoal): string {
  return (
    CONTENT_GOAL_OPTIONS.find((option) => option.value === goal)?.label ?? goal
  );
}

export const DEFAULT_CONTENT_GOAL: ContentGoal = "build_authority";
