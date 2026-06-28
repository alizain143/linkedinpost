import type { ApiCreditsBalance } from "@/lib/api/types/credits";
import type { ApiDashboardStats } from "@/lib/api/types/dashboard";
import { getCreditUsageDisplay } from "@/lib/credit-usage";
import { formatScheduledDateTime } from "@/lib/format-relative-time";
import { getPlanLabel } from "@/lib/plan-labels";

export type DashboardMetricTile = {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  icon: string;
};

export function buildDashboardMetrics(
  stats: ApiDashboardStats,
  credits: ApiCreditsBalance | undefined,
): DashboardMetricTile[] {
  const usage = credits
    ? getCreditUsageDisplay(credits)
    : getCreditUsageDisplay({
        used: stats.credits.used,
        limit: stats.credits.limit,
        remaining: Math.max(0, stats.credits.limit - stats.credits.used),
      });

  const scheduledSub = stats.nextScheduled
    ? `Next: ${formatScheduledDateTime(stats.nextScheduled.scheduledAt)}`
    : "None scheduled";

  return [
    {
      label: "Current Plan",
      value: getPlanLabel(stats.plan),
      sub: "Your workspace plan",
      icon: "workspace_premium",
    },
    {
      label: "Credits Used",
      value: String(usage.used),
      unit: `/ ${usage.limit}`,
      sub: `${usage.usagePercentLabel}% of monthly limit`,
      icon: "bolt",
    },
    {
      label: "Drafts",
      value: String(stats.counts.drafts),
      sub: `${stats.counts.drafts} in workspace`,
      icon: "draft",
    },
    {
      label: "Scheduled Posts",
      value: String(stats.counts.scheduled),
      sub: scheduledSub,
      icon: "schedule",
    },
    {
      label: "Generated This Month",
      value: String(stats.counts.generatedThisMonth),
      sub: "This month",
      icon: "trending_up",
    },
  ];
}

export function formatApprovalQueueSubtitle(count: number): string {
  if (count === 0) return "No posts ready for review";
  if (count === 1) return "1 post ready for review";
  return `${count} posts ready for review`;
}
