"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  getUserFirstName,
  useCurrentUser,
} from "@/hooks/api/use-auth-api";
import {
  useAutopilotConfig,
  useAutopilotPlannedPosts,
} from "@/hooks/api/use-autopilot-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { useDashboardStats } from "@/hooks/api/use-dashboard-api";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  AutopilotStatusSummary,
  getAutopilotStatusBadge,
} from "@/components/sections/app/autopilot/AutopilotStatusSummary";
import { QUICK_DRAFT_CREDIT_COST } from "@/lib/credit-costs";
import { getCreditUsageDisplay } from "@/lib/credit-usage";
import {
  buildDashboardMetrics,
  formatApprovalQueueSubtitle,
} from "@/lib/dashboard-metrics";
import {
  formatRelativeTime,
  formatResetDate,
} from "@/lib/format-relative-time";
import { getPostTypeLabel } from "@/lib/post-types";
import { cn } from "@/lib/utils";
import { useAppUi } from "@/providers/app-ui-provider";

const METRIC_TINTS: Record<string, { bg: string; color: string }> = {
  workspace_premium: { bg: "#eef2ff", color: "#4f46e5" },
  bolt: { bg: "#fff8eb", color: "#d97706" },
  draft: { bg: "#ecfeff", color: "#0891b2" },
  schedule: { bg: "#f5f0ff", color: "#7c3aed" },
  trending_up: { bg: "#f0fdf4", color: "#16a34a" },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="pp-2col">
        <div className="h-36 animate-pulse rounded-2xl bg-[#eceef4]" />
        <div className="h-36 animate-pulse rounded-2xl bg-[#eceef4]" />
      </div>
      <div className="pp-metrics">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[132px] animate-pulse rounded-[15px] bg-[#eceef4]"
          />
        ))}
      </div>
      <div className="pp-2col-wide">
        <div className="flex flex-col gap-[18px]">
          <div className="h-40 animate-pulse rounded-2xl bg-[#eceef4]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#eceef4]" />
        </div>
        <div className="flex flex-col gap-[18px]">
          <div className="h-56 animate-pulse rounded-2xl bg-[#eceef4]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[#eceef4]" />
        </div>
      </div>
    </div>
  );
}

function AutopilotDashboardCard({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { data: config, isLoading: configLoading } =
    useAutopilotConfig(workspaceId);
  const { data: plannedPosts, isLoading: plannedLoading } =
    useAutopilotPlannedPosts(workspaceId);

  const isLoading = configLoading || plannedLoading;
  const statusBadge = config ? getAutopilotStatusBadge(config) : null;

  return (
    <Link
      href="/app/autopilot"
      className="relative block overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-5 text-white"
    >
      <div className="pointer-events-none absolute -right-[5%] -top-[30%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.16),transparent_70%)]" />
      <div className="relative mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/15">
            <MsIcon name="auto_mode" size={21} className="text-white" />
          </div>
          <span className="font-display text-[15px] font-bold">Autopilot</span>
        </div>
        {isLoading || !statusBadge ? (
          <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-white/10" />
        ) : (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              statusBadge.active
                ? "bg-[rgba(94,234,212,0.14)] text-[#5eead4]"
                : "bg-white/10 text-white/70"
            }`}
          >
            {statusBadge.active ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            ) : null}
            {statusBadge.label}
          </span>
        )}
      </div>
      {isLoading || !config ? (
        <div className="relative flex flex-wrap gap-[26px]">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}>
              <div className="mb-1 h-3 w-16 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/15" />
            </div>
          ))}
        </div>
      ) : (
        <AutopilotStatusSummary
          config={config}
          plannedPosts={plannedPosts}
          compact
        />
      )}
    </Link>
  );
}

type DashboardContentProps = {
  canGeneratePost: boolean;
  onGenerateClick: () => void;
};

function DashboardContent({
  canGeneratePost,
  onGenerateClick,
}: DashboardContentProps) {
  const { activeWorkspaceId } = useWorkspace();
  const { balance } = useCredits();
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useDashboardStats(activeWorkspaceId);

  const creditUsage = useMemo(() => {
    if (balance) {
      return getCreditUsageDisplay(balance);
    }
    if (!stats) {
      return null;
    }
    return getCreditUsageDisplay({
      used: stats.credits.used,
      limit: stats.credits.limit,
      remaining: Math.max(0, stats.credits.limit - stats.credits.used),
    });
  }, [balance, stats]);

  return (
    <QueryState
      isLoading={isLoading || !activeWorkspaceId || !stats}
      error={error}
      onRetry={() => void refetch()}
      skeleton={<DashboardSkeleton />}
    >
      {stats ? (
        <>
          <div className="pp-2col mb-5">
            <AutopilotDashboardCard workspaceId={activeWorkspaceId!} />

            <Link
              href="/app/approvals"
              className="flex flex-col justify-between rounded-2xl border border-[#eceef4] bg-white p-5 hover:border-[#dfe3f0]"
            >
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#fff8eb]">
                    <MsIcon name="fact_check" size={21} className="text-[#d97706]" />
                  </div>
                  <span className="font-display text-[15px] font-bold">
                    Approval queue
                  </span>
                </div>
                <span className="font-display text-[22px] font-extrabold text-[#d97706]">
                  {stats.counts.awaitingApproval}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748b]">
                  {formatApprovalQueueSubtitle(stats.counts.awaitingApproval)}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5]">
                  Review now
                  <MsIcon name="arrow_forward" size={16} />
                </span>
              </div>
            </Link>
          </div>

          <div className="pp-metrics mb-5">
            {buildDashboardMetrics(stats, balance).map((metric) => {
              const tint =
                METRIC_TINTS[metric.icon] ?? { bg: "#eef2ff", color: "#4f46e5" };
              return (
                <div
                  key={metric.label}
                  className="rounded-[15px] border border-[#eceef4] bg-white p-[17px]"
                >
                  <div
                    className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
                    style={{ background: tint.bg }}
                  >
                    <MsIcon
                      name={metric.icon}
                      size={21}
                      style={{ color: tint.color }}
                    />
                  </div>
                  <div className="mb-1 text-[12.5px] font-medium text-[#7886a0]">
                    {metric.label}
                  </div>
                  <div className="mb-0.5 flex items-baseline gap-1">
                    <span className="font-display text-[25px] font-extrabold tracking-[-0.02em]">
                      {metric.value}
                    </span>
                    {metric.unit ? (
                      <span className="text-[13px] font-semibold text-[#94a3b8]">
                        {metric.unit}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11.5px] text-[#94a3b8]">{metric.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="pp-2col-wide">
            <div className="flex flex-col gap-[18px]">
              <div className="rounded-2xl border border-[#eceef4] bg-white p-[22px]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold">
                      Monthly credit usage
                    </h3>
                    <p className="text-[13px] text-[#7886a0]">
                      {balance
                        ? `Resets ${formatResetDate(balance.periodEnd)}`
                        : creditUsage
                          ? "Credit balance"
                          : "Loading credits…"}
                    </p>
                  </div>
                  {creditUsage ? (
                    <span className="font-display text-[22px] font-extrabold">
                      {creditUsage.used}
                      <span className="text-sm font-semibold text-[#94a3b8]">
                        {" "}
                        / {creditUsage.limit}
                      </span>
                    </span>
                  ) : (
                    <span className="h-7 w-20 animate-pulse rounded-lg bg-[#eceef4]" />
                  )}
                </div>
                <div className="mb-2 h-3 overflow-hidden rounded-full bg-[#f1f3f8]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]"
                    style={{
                      width: creditUsage
                        ? `${creditUsage.usagePercent}%`
                        : "0%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#94a3b8]">
                  <span>
                    {creditUsage
                      ? `${creditUsage.remaining} credits remaining`
                      : "—"}
                  </span>
                  <span>
                    {creditUsage
                      ? `${creditUsage.usagePercentLabel}% used`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#eceef4] bg-white px-1.5 pb-2 pt-1.5">
                <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
                  <h3 className="font-display text-base font-bold">Recent drafts</h3>
                  <Link
                    href="/app/posts?status=draft"
                    className="text-[13px] font-semibold text-[#4f46e5]"
                  >
                    View all
                  </Link>
                </div>
                {stats.recentDrafts.length === 0 ? (
                  <div className="px-4 pb-4 pt-1 text-[13px] text-[#64748b]">
                    No drafts yet.{" "}
                    <Link href="/app/generate" className="font-semibold text-[#4f46e5]">
                      Generate your first post
                    </Link>
                  </div>
                ) : (
                  stats.recentDrafts.map((draft) => {
                    const postTypeLabel = getPostTypeLabel(draft.postType);
                    const subtitle = postTypeLabel
                      ? `${postTypeLabel} · Edited ${formatRelativeTime(draft.updatedAt)}`
                      : `Edited ${formatRelativeTime(draft.updatedAt)}`;

                    return (
                      <Link
                        key={draft.id}
                        href={`/app/posts/${draft.id}`}
                        className="flex items-center gap-3 rounded-[11px] px-3.5 py-3 hover:bg-[#f8f9fc]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f5f0ff]">
                          <MsIcon name="draft" size={19} className="text-[#7c3aed]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#1e293b]">
                            {draft.hook}
                          </div>
                          <div className="text-xs text-[#94a3b8]">{subtitle}</div>
                        </div>
                        <MsIcon
                          name="chevron_right"
                          size={19}
                          className="text-[#cbd2e0]"
                        />
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[18px]">
              {stats.plan === "free" ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#312e81] to-[#4338ca] p-[22px] text-white shadow-[0_18px_40px_-22px_rgba(67,56,202,0.6)]">
                  <div className="pointer-events-none absolute -right-[20%] -top-[30%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_70%)]" />
                  <div className="relative">
                    <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                      <MsIcon name="bolt" size={14} />
                      POWER UP
                    </div>
                    <h3 className="mb-2 font-display text-[19px] font-extrabold tracking-[-0.01em]">
                      Need more content?
                    </h3>
                    <p className="mb-[18px] text-[13.5px] leading-relaxed text-white/80">
                      Upgrade to Pro to unlock 200 monthly credits and a 30-day
                      content calendar.
                    </p>
                    <Link
                      href="/app/billing"
                      className="block w-full rounded-[10px] bg-white py-[11px] text-center text-sm font-bold text-[#4338ca] hover:bg-[#f1f1ff]"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[#eceef4] bg-white p-[18px]">
                <h3 className="mb-3.5 font-display text-[15px] font-bold">
                  Quick actions
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      href: "/app/generate",
                      icon: "auto_awesome",
                      tint: "#eef2ff",
                      color: "#4f46e5",
                      label: "Generate a new post",
                      onClick: canGeneratePost ? undefined : onGenerateClick,
                    },
                    {
                      href: "/app/calendar",
                      icon: "calendar_month",
                      tint: "#ecfeff",
                      color: "#0891b2",
                      label: "Plan your week",
                    },
                    {
                      href: "/app/profile",
                      icon: "badge",
                      tint: "#f5f0ff",
                      color: "#7c3aed",
                      label: "Edit content profile",
                    },
                  ].map((action) =>
                    action.onClick ? (
                      <button
                        key={action.href}
                        type="button"
                        onClick={action.onClick}
                        className="flex w-full items-center gap-3 rounded-[11px] border border-[#eef0f5] p-[11px] text-left hover:border-[#dfe3f0] hover:bg-[#fafbff]"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                          style={{ background: action.tint }}
                        >
                          <MsIcon
                            name={action.icon}
                            size={18}
                            style={{ color: action.color }}
                          />
                        </div>
                        <span className="text-[13.5px] font-semibold text-[#1e293b]">
                          {action.label}
                        </span>
                      </button>
                    ) : (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center gap-3 rounded-[11px] border border-[#eef0f5] p-[11px] hover:border-[#dfe3f0] hover:bg-[#fafbff]"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                          style={{ background: action.tint }}
                        >
                          <MsIcon
                            name={action.icon}
                            size={18}
                            style={{ color: action.color }}
                          />
                        </div>
                        <span className="text-[13.5px] font-semibold text-[#1e293b]">
                          {action.label}
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </QueryState>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { linkedinConnectionState, openConnect, showToast } = useAppUi();
  const { activeWorkspaceId } = useWorkspace();
  const { data: user } = useCurrentUser();
  const { data: autopilotConfig } = useAutopilotConfig(activeWorkspaceId);
  const { canAfford, isLoading: creditsLoading } = useCredits();
  const welcomeName = getUserFirstName(user) ?? "there";
  const canGeneratePost = creditsLoading || canAfford(QUICK_DRAFT_CREDIT_COST);
  const autopilotEnabled = autopilotConfig?.enabled ?? false;

  const handleGenerateClick = () => {
    if (!canGeneratePost) {
      showToast(
        "You're out of credits. Upgrade your plan to keep generating.",
        "error",
      );
      router.push("/app/billing");
      return;
    }
    router.push("/app/generate");
  };

  return (
    <div>
      {linkedinConnectionState === "disconnected" ? (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[#cfe3f7] bg-gradient-to-br from-[#eaf3fc] to-[#f4f9ff] px-5 py-4">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] bg-[#0a66c2] font-display text-[19px] font-extrabold text-white">
            in
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="font-display text-[15px] font-bold text-[#0d1326]">
              Connect your LinkedIn account
            </div>
            <div className="text-[13px] text-[#5a667a]">
              Link your profile to schedule and publish posts straight from
              linkedinpost.ai.
            </div>
          </div>
          <Button
            type="button"
            variant="linkedin"
            size="md"
            className="shrink-0 rounded-[10px] shadow-[0_4px_12px_rgba(10,102,194,0.28)]"
            onClick={openConnect}
          >
            <MsIcon name="link" size={17} />
            Connect LinkedIn
          </Button>
        </div>
      ) : linkedinConnectionState === "needsPublishScope" ? (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-[#fffdf5] px-5 py-4">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] bg-[#d97706]">
            <MsIcon name="warning" size={22} className="text-white" />
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="font-display text-[15px] font-bold text-[#92400e]">
              Finish LinkedIn setup to publish
            </div>
            <div className="text-[13px] text-[#a16207]">
              Your account is linked, but publish permission is missing. Grant
              access to schedule and publish posts.
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="shrink-0 rounded-[10px]"
            onClick={openConnect}
          >
            <MsIcon name="link" size={17} />
            Finish setup
          </Button>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="font-display text-[26px] font-extrabold tracking-[-0.025em] text-[#0f172a]">
            Welcome back, {welcomeName}
          </h2>
          <p className="mt-1 text-[15px] text-[#64748b]">
            Create, review, approve, and publish LinkedIn content from one
            workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/app/autopilot"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[11px] border px-4 py-[11px] text-[14px] font-semibold transition-colors",
              autopilotEnabled
                ? "border-[#99f6e4] bg-[#f0fdfa] text-[#0f766e] hover:border-[#5eead4] hover:bg-[#ccfbf1]"
                : "border-[#e3e6ef] bg-white text-[#1e293b] hover:border-[#cbd2e0] hover:bg-[#f6f7fb]",
            )}
          >
            <MsIcon
              name="auto_mode"
              size={18}
              className={autopilotEnabled ? "text-[#0d9488]" : "text-[#7c3aed]"}
            />
            {autopilotEnabled ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
                Autopilot on
              </>
            ) : (
              "Turn on Autopilot"
            )}
          </Link>
          <Link
            href="/app/generate/calendar"
            className="inline-flex items-center gap-1.5 rounded-[11px] border border-[#e3e6ef] bg-white px-4 py-[11px] text-[14px] font-semibold text-[#1e293b] hover:border-[#cbd2e0] hover:bg-[#f6f7fb]"
          >
            <MsIcon name="calendar_month" size={18} className="text-[#0891b2]" />
            Create Calendar
          </Link>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[11px] px-[18px] py-[11px] text-[14px] shadow-[0_5px_14px_rgba(79,70,229,0.28)]"
            disabled={!canGeneratePost}
            onClick={handleGenerateClick}
          >
            <MsIcon name="auto_awesome" size={18} />
            Generate One Post
          </Button>
        </div>
      </div>

      <DashboardContent
        canGeneratePost={canGeneratePost}
        onGenerateClick={handleGenerateClick}
      />
    </div>
  );
}
