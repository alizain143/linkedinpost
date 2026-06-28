import type {
  ApiAutopilotConfig,
  AutopilotPostingPreset,
  AutopilotPostingPresetLabel,
} from "@/lib/api/types/autopilot";
import type { UserPlan } from "@/lib/api/types/enums";
import { formatScheduledDateTime } from "@/lib/format-relative-time";

export const AUTOPILOT_CREDIT_COST = 10;

export const DEFAULT_AUTOPILOT_POSTING_DAYS = [1, 3, 4, 5, 7] as const;
export const DEFAULT_AUTOPILOT_POSTING_TIME = "09:00";

export const POSTING_PRESET_DAYS: Record<AutopilotPostingPreset, number[]> = {
  three_per_week: [1, 3, 4, 5, 7],
  daily: [1, 2, 3, 4, 5, 6, 7],
  weekdays: [1, 2, 3, 4, 5],
  weekly: [1],
};

export const POSTING_PRESET_OPTIONS: Array<{
  value: AutopilotPostingPreset;
  label: string;
  days: number[];
}> = [
  { value: "three_per_week", label: "3× / week", days: POSTING_PRESET_DAYS.three_per_week },
  { value: "daily", label: "Daily", days: POSTING_PRESET_DAYS.daily },
  { value: "weekdays", label: "Weekdays", days: POSTING_PRESET_DAYS.weekdays },
  { value: "weekly", label: "Weekly", days: POSTING_PRESET_DAYS.weekly },
];

const PRESET_FREQUENCY_LABELS: Record<AutopilotPostingPreset, string> = {
  three_per_week: "3× per week",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
};

export function canUseAutopilot(plan: UserPlan): boolean {
  return plan === "pro" || plan === "agency";
}

export function derivePostingPreset(
  postingDays: number[],
): AutopilotPostingPresetLabel {
  const normalized = [...postingDays].sort((a, b) => a - b).join(",");

  for (const option of POSTING_PRESET_OPTIONS) {
    const presetDays = [...option.days].sort((a, b) => a - b).join(",");
    if (presetDays === normalized) {
      return option.value;
    }
  }

  return "custom";
}

export function formatAutopilotFrequency(config: ApiAutopilotConfig): string {
  if (config.postingPreset !== "custom") {
    return PRESET_FREQUENCY_LABELS[config.postingPreset];
  }

  const count = config.postingDays.length;
  return `${count} day${count === 1 ? "" : "s"} / week`;
}

export function formatNextRunAt(
  iso: string | null | undefined,
  timezone: string,
): string {
  if (!iso) return "—";

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatPlannedPostSchedule(iso: string): string {
  return formatScheduledDateTime(iso);
}

export function postingDaysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((day, index) => day === sortedB[index]);
}

export function togglePostingDay(days: number[], day: number): number[] {
  const set = new Set(days);
  if (set.has(day)) {
    set.delete(day);
  } else {
    set.add(day);
  }
  return [...set].sort((a, b) => a - b);
}
