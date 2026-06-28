"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryState } from "@/components/app/query-state";
import { StatusBadge } from "@/components/app/app-ui";
import {
  AutopilotStatusSummary,
  getAutopilotStatusBadge,
} from "@/components/sections/app/autopilot/AutopilotStatusSummary";
import { Button, toggleVariant } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import {
  useAutopilotConfig,
  useAutopilotPlannedPosts,
  useUpsertAutopilotConfig,
} from "@/hooks/api/use-autopilot-api";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { useLinkedInConnection } from "@/hooks/api/use-linkedin-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type {
  AutopilotApprovalMode,
  AutopilotPostingPreset,
} from "@/lib/api/types/autopilot";
import {
  APPROVAL_MODE_OPTIONS,
  AUTOPILOT_CREDIT_COST,
  buildDayProfileOverrides,
  canUseAutopilot,
  derivePostingPreset,
  formatAutopilotPublishState,
  formatPlannedPostSchedule,
  POSTING_PRESET_OPTIONS,
  readDayProfileOverrides,
  togglePostingDay,
} from "@/lib/autopilot-utils";
import { POSTING_DAY_OPTIONS } from "@/lib/calendar-generation-utils";
import { getPlanGateState } from "@/lib/plan-gate-utils";
import { getPostSourceLabel } from "@/lib/post-source";
import { DEFAULT_TIMEZONE, timezoneLabel } from "@/lib/timezones";
import { useAppUi } from "@/providers/app-ui-provider";

type ScheduleFormState = {
  postingDays: number[];
  postingPreset: AutopilotPostingPreset | "custom";
  postingTime: string;
  contentProfileId: string;
  approvalMode: AutopilotApprovalMode;
  dayOverrides: Record<number, string>;
};

function buildUpsertBody(form: ScheduleFormState, enabled?: boolean) {
  const scheduleBody =
    form.postingPreset !== "custom"
      ? {
          postingPreset: form.postingPreset,
          postingTime: form.postingTime,
        }
      : {
          postingDays: form.postingDays,
          postingTime: form.postingTime,
        };

  return {
    ...(enabled !== undefined ? { enabled } : {}),
    ...scheduleBody,
    contentProfileId: form.contentProfileId || undefined,
    approvalMode: form.approvalMode,
    dayProfileOverrides: buildDayProfileOverrides(
      form.dayOverrides,
      form.contentProfileId,
    ),
  };
}

function AutopilotSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-20 animate-pulse rounded-2xl bg-[#eceef4]" />
      <div className="h-36 animate-pulse rounded-2xl bg-[#eceef4]" />
      <div className="pp-2col">
        <div className="h-64 animate-pulse rounded-2xl bg-[#eceef4]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#eceef4]" />
      </div>
      <div className="h-48 animate-pulse rounded-2xl bg-[#eceef4]" />
    </div>
  );
}

export default function Autopilot() {
  const { activeWorkspaceId } = useWorkspace();
  const { confirmPauseAutopilot, showToast } = useAppUi();
  const { balance, isLoading: creditsLoading, isError: creditsError, refetch: refetchCredits } =
    useCredits();
  const { data: currentUser } = useCurrentUser();
  const { data: linkedInConnection } = useLinkedInConnection();

  const planGate = getPlanGateState({
    isLoading: creditsLoading,
    isError: creditsError,
    balance,
  });
  const autopilotAllowed =
    planGate.status === "ready" &&
    planGate.plan != null &&
    canUseAutopilot(planGate.plan);

  const {
    data: config,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useAutopilotConfig(activeWorkspaceId);

  const timezone = config?.timezone || currentUser?.timezone || DEFAULT_TIMEZONE;

  const {
    data: plannedPosts,
    isLoading: plannedLoading,
    error: plannedError,
    refetch: refetchPlanned,
  } = useAutopilotPlannedPosts(activeWorkspaceId);

  const {
    data: profiles,
    isLoading: profilesLoading,
    error: profilesError,
    refetch: refetchProfiles,
  } = useContentProfiles(activeWorkspaceId);

  const upsertMutation = useUpsertAutopilotConfig(activeWorkspaceId);

  const [form, setForm] = useState<ScheduleFormState>({
    postingDays: [...POSTING_PRESET_OPTIONS[0].days],
    postingPreset: "three_per_week",
    postingTime: "09:00",
    contentProfileId: "",
    approvalMode: "require_approval",
    dayOverrides: {},
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDayOverrides, setShowDayOverrides] = useState(false);

  const initializedWorkspaceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeWorkspaceId || !config) return;

    if (initializedWorkspaceRef.current !== activeWorkspaceId) {
      initializedWorkspaceRef.current = activeWorkspaceId;
      setForm({
        postingDays: [...config.postingDays],
        postingPreset: config.postingPreset,
        postingTime: config.postingTime,
        contentProfileId: config.contentProfileId ?? "",
        approvalMode: config.approvalMode,
        dayOverrides: readDayProfileOverrides(config.dayProfileOverrides),
      });
      setShowDayOverrides(
        Object.keys(readDayProfileOverrides(config.dayProfileOverrides)).length >
          0,
      );
    }
  }, [activeWorkspaceId, config]);

  useEffect(() => {
    if (!profiles?.length || form.contentProfileId) return;

    const defaultProfile = profiles.find((p) => p.isDefault) ?? profiles[0];
    if (defaultProfile) {
      setForm((prev) => ({ ...prev, contentProfileId: defaultProfile.id }));
    }
  }, [profiles, form.contentProfileId]);

  const profileOptions = useMemo(
    () =>
      profiles?.map((profile) => ({
        value: profile.id,
        label: profile.isDefault ? `${profile.name} (Default)` : profile.name,
      })) ?? [],
    [profiles],
  );

  const selectedProfile = useMemo(
    () => profiles?.find((profile) => profile.id === form.contentProfileId),
    [profiles, form.contentProfileId],
  );

  const profileMissingPillars =
    !selectedProfile || selectedProfile.pillars.length === 0;

  const activePreset = useMemo(
    () => derivePostingPreset(form.postingDays),
    [form.postingDays],
  );

  const linkedInReady =
    linkedInConnection?.connected && linkedInConnection?.publishReady;

  const handleToggleEnabled = useCallback(() => {
    if (!config || !autopilotAllowed) return;

    if (config.enabled) {
      confirmPauseAutopilot(() => {
        upsertMutation.mutate(
          { enabled: false },
          {
            onError: (err) => {
              showToast(getApiErrorMessage(err), "error");
            },
          },
        );
      });
      return;
    }

    if (profileMissingPillars) {
      showToast(
        "Add at least one content pillar to your profile before turning on autopilot.",
        "error",
      );
      return;
    }

    if (form.approvalMode === "auto_schedule" && !linkedInReady) {
      showToast(
        "Connect LinkedIn with publish permission before enabling auto-schedule.",
        "error",
      );
      return;
    }

    upsertMutation.mutate(buildUpsertBody(form, true), {
        onSuccess: () => {
          showToast("Autopilot turned on", "auto_mode");
        },
        onError: (err) => {
          const fallback =
            "Upgrade to Pro to unlock autopilot.";
          showToast(
            getApiErrorMessage(err, fallback),
            "error",
          );
        },
      },
    );
  }, [
    autopilotAllowed,
    config,
    confirmPauseAutopilot,
    form,
    linkedInReady,
    profileMissingPillars,
    showToast,
    upsertMutation,
  ]);

  const handlePresetSelect = (preset: AutopilotPostingPreset) => {
    const option = POSTING_PRESET_OPTIONS.find((o) => o.value === preset);
    if (!option) return;

    setForm((prev) => ({
      ...prev,
      postingPreset: preset,
      postingDays: [...option.days],
    }));
    setSaveError(null);
  };

  const handleDayToggle = (day: number) => {
    setForm((prev) => {
      const postingDays = togglePostingDay(prev.postingDays, day);
      return {
        ...prev,
        postingDays,
        postingPreset: derivePostingPreset(postingDays),
      };
    });
    setSaveError(null);
  };

  const handleSaveSchedule = () => {
    if (form.postingDays.length === 0) {
      setSaveError("Select at least one posting day.");
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(form.postingTime)) {
      setSaveError("Posting time must be in HH:mm format.");
      return;
    }

    if (profileMissingPillars) {
      setSaveError(
        "Add at least one content pillar to your content profile first.",
      );
      return;
    }

    if (form.approvalMode === "auto_schedule" && !linkedInReady) {
      setSaveError(
        "Connect LinkedIn with publish permission before saving auto-schedule mode.",
      );
      return;
    }

    setSaveError(null);

    upsertMutation.mutate(buildUpsertBody(form), {
      onSuccess: () => {
        showToast("Autopilot schedule saved", "save");
      },
      onError: (err) => {
        setSaveError(getApiErrorMessage(err));
      },
    });
  };

  const isLoading =
    configLoading || plannedLoading || profilesLoading || !activeWorkspaceId;
  const queryError = configError || plannedError || profilesError;

  const statusBadge = config ? getAutopilotStatusBadge(config) : null;

  return (
    <QueryState
      isLoading={isLoading || !config}
      error={queryError}
      onRetry={() => {
        void refetchConfig();
        void refetchPlanned();
        void refetchProfiles();
      }}
      skeleton={<AutopilotSkeleton />}
    >
      {config ? (
        <div>
          {planGate.status === "error" ? (
            <div className="mb-5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4">
              <p className="text-[13px] text-[#b91c1c]">
                Could not load your plan. Retry before changing Autopilot settings.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => void refetchCredits()}
              >
                Retry
              </Button>
            </div>
          ) : null}
          {planGate.status === "ready" && !autopilotAllowed ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-[#fffdf5] px-5 py-4">
              <div className="min-w-[200px] flex-1">
                <div className="font-display text-[15px] font-bold text-[#92400e]">
                  Upgrade to Pro for Autopilot
                </div>
                <div className="text-[13px] text-[#a16207]">
                  Automatically generate posts on your schedule with AI Council
                  (10 credits per post).
                </div>
              </div>
              <Button
                href="/app/billing"
                variant="primary"
                size="md"
                className="shrink-0 rounded-[10px]"
              >
                View plans
              </Button>
            </div>
          ) : null}
          {profileMissingPillars ? (
            <div className="mb-5 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-5 py-4">
              <p className="text-[13px] text-[#92400e]">
                Autopilot needs at least one{" "}
                <strong>content pillar</strong> on your profile to pick topics.
                Edit your content profile and add pillars (e.g. &quot;Founder
                lessons&quot;), then save your schedule again.
              </p>
              <Button
                href="/app/profile"
                variant="secondary"
                size="sm"
                className="mt-3"
              >
                Content profiles
              </Button>
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold">Autopilot</h2>
                <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
                  PRO
                </span>
              </div>
              <p className="mt-1 text-[14px] text-[#64748b]">
                Automatically generates and queues posts from your content
                strategy.
              </p>
            </div>
            <Button
              variant={config.enabled ? "secondary" : "primary"}
              size="md"
              disabled={!autopilotAllowed || upsertMutation.isPending}
              onClick={handleToggleEnabled}
            >
              <MsIcon
                name={config.enabled ? "pause" : "play_arrow"}
                size={18}
              />
              {config.enabled ? "Pause Autopilot" : "Turn On Autopilot"}
            </Button>
          </div>

          <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-5 text-white">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/15">
                  <MsIcon name="auto_mode" size={21} className="text-white" />
                </div>
                <span className="font-display text-[15px] font-bold">Status</span>
              </div>
              {statusBadge ? (
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
              ) : null}
            </div>
            <AutopilotStatusSummary
              config={config}
              plannedPosts={plannedPosts}
            />
          </div>

          <div className="pp-2col mb-5">
            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <h3 className="mb-4 font-display text-[15px] font-bold">
                Posting frequency
              </h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {POSTING_PRESET_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={toggleVariant(activePreset === option.value)}
                    size="sm"
                    onClick={() => handlePresetSelect(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {POSTING_DAY_OPTIONS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={toggleVariant(
                      form.postingDays.includes(day.value),
                    )}
                    size="day"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              <InputField
                label="Publish time"
                variant="app-sm"
                type="time"
                value={form.postingTime}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    postingTime: event.target.value,
                    postingPreset: derivePostingPreset(prev.postingDays),
                  }));
                  setSaveError(null);
                }}
              />
              <p className="mt-2 text-[12px] text-[#64748b]">
                Uses workspace timezone ({timezoneLabel(timezone)}).
              </p>
              {saveError ? (
                <p className="mt-3 text-[13px] font-medium text-[#dc2626]">
                  {saveError}
                </p>
              ) : null}
              <Button
                type="button"
                variant="primary"
                size="md"
                className="mt-4 rounded-[10px]"
                disabled={upsertMutation.isPending}
                onClick={handleSaveSchedule}
              >
                Save schedule
              </Button>
            </div>

            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <h3 className="mb-4 font-display text-[15px] font-bold">
                Content strategy
              </h3>
              {profilesLoading ? (
                <div className="h-10 animate-pulse rounded-lg bg-[#eceef4]" />
              ) : profilesError ? (
                <p className="text-[13px] text-[#dc2626]">
                  Could not load content profiles.
                </p>
              ) : profileOptions.length === 0 ? (
                <div className="rounded-[11px] border border-dashed border-[#dfe3f0] bg-[#fafbff] px-4 py-5 text-center">
                  <p className="text-[13px] text-[#64748b]">
                    Add a content profile to power autopilot generation.
                  </p>
                  <Button
                    href="/app/profile"
                    variant="secondary"
                    size="sm"
                    className="mt-3 rounded-[10px]"
                  >
                    Set up profile
                  </Button>
                </div>
              ) : (
                <>
                  <SelectField
                    label="Default content profile"
                    selectClassName="text-sm"
                    options={profileOptions}
                    value={form.contentProfileId}
                    onChange={(event) => {
                      setForm((prev) => ({
                        ...prev,
                        contentProfileId: event.target.value,
                      }));
                      setSaveError(null);
                    }}
                  />

                  <div className="mt-4">
                    <button
                      type="button"
                      className="text-[13px] font-semibold text-[#4f46e5]"
                      onClick={() => setShowDayOverrides((value) => !value)}
                    >
                      {showDayOverrides ? "Hide day overrides" : "Customize by day"}
                    </button>
                    {showDayOverrides ? (
                      <div className="mt-3 space-y-2">
                        {form.postingDays
                          .slice()
                          .sort((a, b) => a - b)
                          .map((day) => {
                            const dayLabel =
                              POSTING_DAY_OPTIONS.find((option) => option.value === day)
                                ?.label ?? `Day ${day}`;
                            const overrideOptions = [
                              { value: "", label: "Use default profile" },
                              ...profileOptions,
                            ];

                            return (
                              <SelectField
                                key={day}
                                label={dayLabel}
                                selectClassName="text-sm"
                                options={overrideOptions}
                                value={form.dayOverrides[day] ?? ""}
                                onChange={(event) => {
                                  const profileId = event.target.value;
                                  setForm((prev) => {
                                    const dayOverrides = { ...prev.dayOverrides };
                                    if (!profileId) {
                                      delete dayOverrides[day];
                                    } else {
                                      dayOverrides[day] = profileId;
                                    }
                                    return { ...prev, dayOverrides };
                                  });
                                  setSaveError(null);
                                }}
                              />
                            );
                          })}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 border-t border-[#eef0f5] pt-4">
                    <div className="mb-3 text-[13px] font-semibold text-[#1e293b]">
                      After generation
                    </div>
                    <div className="space-y-2">
                      {APPROVAL_MODE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer gap-3 rounded-[11px] border px-3 py-3 ${
                            form.approvalMode === option.value
                              ? "border-[#c7d2fe] bg-[#eef2ff]"
                              : "border-[#eef0f5] bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="approvalMode"
                            value={option.value}
                            checked={form.approvalMode === option.value}
                            onChange={() => {
                              setForm((prev) => ({
                                ...prev,
                                approvalMode: option.value,
                              }));
                              setSaveError(null);
                            }}
                            className="mt-1"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-[#1e293b]">
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-[#64748b]">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {form.approvalMode === "auto_schedule" && !linkedInReady ? (
                      <p className="mt-3 text-[12px] text-[#92400e]">
                        Connect LinkedIn with publish permission to use auto-schedule.
                      </p>
                    ) : null}
                  </div>
                </>
              )}
              <p className="mt-4 text-[12.5px] text-[#64748b]">
                Each autopilot post uses {AUTOPILOT_CREDIT_COST} credits via AI
                Council.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
            <h3 className="mb-4 font-display text-[15px] font-bold">
              Next planned posts
            </h3>
            {plannedPosts && plannedPosts.length > 0 ? (
              <div className="space-y-2">
                {plannedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/app/posts/${post.id}`}
                    className="flex items-center justify-between rounded-[11px] border border-[#eef0f5] px-4 py-3 hover:border-[#dfe3f0] hover:bg-[#fafbff]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#94a3b8]">
                        <span>
                          {post.scheduledAt
                            ? formatPlannedPostSchedule(post.scheduledAt, timezone)
                            : "Unscheduled"}
                        </span>
                        <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-bold text-[#4f46e5]">
                          {getPostSourceLabel(post.source)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#1e293b]">
                        {post.topic || post.hook}
                      </div>
                      {post.publishState ? (
                        <div className="mt-1 text-[12px] text-[#64748b]">
                          {formatAutopilotPublishState(post.publishState)}
                        </div>
                      ) : null}
                    </div>
                    <StatusBadge status={post.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#64748b]">
                No upcoming autopilot posts yet.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}
