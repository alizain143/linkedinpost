"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appLabel } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { CalendarJobProgressPanel } from "@/components/sections/app/generate/CalendarJobProgress";
import { Button, toggleVariant } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import {
  useCalendarGenerateMutation,
  useGenerationJob,
} from "@/hooks/api/use-generation-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import {
  canUse30DayCalendar,
  DEFAULT_POSTING_DAYS,
  DEFAULT_POSTING_TIME,
  getCalendarCreditCost,
  isCalendarJobResult,
  normalizePostingTime,
  POSTING_DAY_OPTIONS,
  tomorrowDateKey,
} from "@/lib/calendar-generation-utils";
import { isCreditsExhaustedError } from "@/lib/credits-errors";
import { DEFAULT_TIMEZONE, timezoneLabel } from "@/lib/timezones";
import { useAppUi } from "@/providers/app-ui-provider";
import {
  addGenerationHistoryEntry,
  loadGenerationSession,
  saveGenerationSession,
  type GenerationHistoryEntry,
} from "@/lib/generation-session";
import { GenerationHistoryPanel } from "@/components/sections/app/generate/GenerationHistoryPanel";

type CalendarFormState = {
  durationDays: 7 | 30;
  contentProfileId: string;
  startDate: string;
  postingTime: string;
  postingDays: number[];
  additionalContext: string;
};

export default function CalendarGenerate() {
  const router = useRouter();
  const { activeWorkspaceId } = useWorkspace();
  const { showToast } = useAppUi();
  const { balance, canAfford } = useCredits();
  const { data: currentUser } = useCurrentUser();

  const timezone = currentUser?.timezone || DEFAULT_TIMEZONE;

  const {
    data: profiles,
    isLoading: profilesLoading,
    error: profilesError,
    refetch: refetchProfiles,
  } = useContentProfiles(activeWorkspaceId);

  const calendarMutation = useCalendarGenerateMutation(activeWorkspaceId);

  const [form, setForm] = useState<CalendarFormState>({
    durationDays: 7,
    contentProfileId: "",
    startDate: "",
    postingTime: DEFAULT_POSTING_TIME,
    postingDays: [...DEFAULT_POSTING_DAYS],
    additionalContext: "",
  });
  const [activeCalendarJobId, setActiveCalendarJobId] = useState<string | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);

  const calendarCompletedRef = useRef<string | null>(null);

  const initializedWorkspaceRef = useRef<string | null>(null);

  const calendarJob = useGenerationJob(activeCalendarJobId, {
    poll: true,
    workspaceId: activeWorkspaceId,
    onCompleted: (job) => {
      if (!activeWorkspaceId || calendarCompletedRef.current === job.id) return;
      calendarCompletedRef.current = job.id;
      const result =
        job.result && "slotCount" in job.result ? job.result : null;
      const { created } = addGenerationHistoryEntry(activeWorkspaceId, {
        kind: "calendar",
        label: result ? `${result.slotCount} posts` : "Calendar",
        topic: `${form.durationDays}-day calendar`,
        calendarJobId: job.id,
        calendarSlotCount: result?.slotCount,
      });
      if (!created) return;
      showToast("Calendar generated", "event_available");
      setHistory(loadGenerationSession(activeWorkspaceId).history);
    },
  });

  const profileOptions = useMemo(
    () =>
      profiles?.map((profile) => ({
        value: profile.id,
        label: profile.isDefault ? `${profile.name} (Default)` : profile.name,
      })) ?? [],
    [profiles],
  );

  useEffect(() => {
    if (!activeWorkspaceId || !profiles) return;

    if (initializedWorkspaceRef.current !== activeWorkspaceId) {
      initializedWorkspaceRef.current = activeWorkspaceId;
      const session = loadGenerationSession(activeWorkspaceId);
      setHistory(session.history);
      // Jobs already in history must not re-fire onCompleted after remount.
      if (
        session.activeCalendarJobId &&
        session.history.some(
          (entry) => entry.calendarJobId === session.activeCalendarJobId,
        )
      ) {
        calendarCompletedRef.current = session.activeCalendarJobId;
      }
      setActiveCalendarJobId(session.activeCalendarJobId);
      setGenerateError(null);

      if (profiles.length === 0) {
        setForm((current) => ({ ...current, contentProfileId: "" }));
        return;
      }

      const defaultProfile =
        profiles.find((profile) => profile.isDefault) ?? profiles[0];
      setForm((current) => ({
        ...current,
        contentProfileId: defaultProfile.id,
        startDate: "",
        postingTime: DEFAULT_POSTING_TIME,
        postingDays: [...DEFAULT_POSTING_DAYS],
      }));
    }
  }, [activeWorkspaceId, profiles]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    saveGenerationSession(activeWorkspaceId, { activeCalendarJobId });
  }, [activeCalendarJobId, activeWorkspaceId]);

  const handleRestoreHistory = (entry: GenerationHistoryEntry) => {
    if (entry.kind === "calendar" && entry.calendarJobId) {
      // Mark handled so remount/onCompleted does not re-append history.
      calendarCompletedRef.current = entry.calendarJobId;
      setActiveCalendarJobId(entry.calendarJobId);
      if (activeWorkspaceId) {
        saveGenerationSession(activeWorkspaceId, {
          activeCalendarJobId: entry.calendarJobId,
        });
      }
      return;
    }
    if (entry.kind === "quick_draft" || entry.kind === "council") {
      router.push("/app/generate");
    }
  };

  const creditCost = getCalendarCreditCost(form.durationDays);
  const canAffordCalendar = canAfford(creditCost);
  const thirtyDayAllowed = balance ? canUse30DayCalendar(balance.plan) : false;
  const calendarJobActive =
    !!activeCalendarJobId &&
    !!calendarJob.data &&
    (calendarJob.data.status === "pending" ||
      calendarJob.data.status === "running");
  const isRunning = calendarMutation.isPending || calendarJobActive;
  const formDisabled = isRunning;

  const canSubmit =
    form.postingDays.length > 0 &&
    !!form.contentProfileId &&
    canAffordCalendar &&
    !isRunning &&
    (profiles?.length ?? 0) > 0 &&
    (form.durationDays === 7 || thirtyDayAllowed);

  const togglePostingDay = (day: number) => {
    setForm((current) => {
      const selected = new Set(current.postingDays);
      if (selected.has(day)) {
        selected.delete(day);
      } else {
        selected.add(day);
      }
      return {
        ...current,
        postingDays: [...selected].sort((a, b) => a - b),
      };
    });
  };

  const buildRequestBody = useCallback(() => {
    return {
      durationDays: form.durationDays,
      contentProfileId: form.contentProfileId || undefined,
      startDate: form.startDate.trim() || undefined,
      postingTime: normalizePostingTime(form.postingTime),
      postingDays: form.postingDays,
      additionalContext: form.additionalContext.trim() || undefined,
    };
  }, [form]);

  const runGenerate = async () => {
    if (form.durationDays === 30 && !thirtyDayAllowed) {
      showToast(
        "Upgrade to Pro to unlock 30-day calendar generation.",
        "error",
      );
      router.push("/app/billing");
      return;
    }

    if (!canAffordCalendar) {
      showToast(
        `You need ${creditCost} credits to generate this calendar. Upgrade your plan to continue.`,
        "error",
      );
      router.push("/app/billing");
      return;
    }

    if (!form.contentProfileId) {
      showToast("Select a content profile before generating.", "error");
      return;
    }

    if (form.postingDays.length === 0) {
      showToast("Select at least one posting day.", "error");
      return;
    }

    setGenerateError(null);
    setActiveCalendarJobId(null);

    try {
      const job = await calendarMutation.mutateAsync(buildRequestBody());
      setActiveCalendarJobId(job.id);
      calendarCompletedRef.current = null;
      if (activeWorkspaceId) {
        saveGenerationSession(activeWorkspaceId, { activeCalendarJobId: job.id });
      }
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Upgrade to Pro to unlock 30-day calendar generation.",
      );
      setGenerateError(message);
      showToast(message, "error");
      if (isCreditsExhaustedError(err)) {
        router.push("/app/billing");
      }
    }
  };

  const pillVariant = (active: boolean) => toggleVariant(active);
  const calendarResult = isCalendarJobResult(calendarJob.data?.result)
    ? calendarJob.data.result
    : null;

  const formPanel = (
    <>
      {!canAffordCalendar && balance ? (
        <div className="mb-4 rounded-[11px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[13px] text-[#92400e]">
          You need {creditCost} credits for this calendar.{" "}
          <Link href="/app/billing" className="font-semibold text-[#4f46e5]">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      <label className={appLabel}>Duration</label>
      <div className="mb-4 flex gap-1 rounded-[10px] bg-[#eef0f5] p-0.5">
        {([7, 30] as const).map((days) => {
          const disabled = days === 30 && !thirtyDayAllowed;
          return (
            <button
              key={days}
              type="button"
              disabled={disabled || formDisabled}
              onClick={() =>
                setForm((current) => ({ ...current, durationDays: days }))
              }
              className={`flex flex-1 flex-col items-center rounded-[8px] px-3 py-2 text-center transition-colors ${
                form.durationDays === days
                  ? "bg-white text-[#4338ca] shadow-sm"
                  : disabled
                    ? "cursor-not-allowed text-[#cbd2e0]"
                    : "text-[#64748b] hover:text-[#1e293b]"
              }`}
            >
              <span className="text-[13px] font-bold">{days}-day</span>
              <span className="text-[10.5px]">
                {getCalendarCreditCost(days)} credits
              </span>
            </button>
          );
        })}
      </div>

      {form.durationDays === 30 && !thirtyDayAllowed ? (
        <div className="mb-4 rounded-[11px] border border-[#e0e7ff] bg-[#eef2ff] px-3 py-2.5 text-[13px] text-[#4338ca]">
          30-day calendars require Pro or Agency.{" "}
          <Link href="/app/billing" className="font-semibold underline">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      <SelectField
        label="Content profile"
        fieldClassName="mb-4"
        options={profileOptions}
        value={form.contentProfileId}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            contentProfileId: event.target.value,
          }))
        }
        disabled={profileOptions.length === 0 || formDisabled}
      />

      <InputField
        label="Start date"
        hint="(optional)"
        type="date"
        fieldClassName="mb-1"
        value={form.startDate}
        onChange={(event) =>
          setForm((current) => ({ ...current, startDate: event.target.value }))
        }
        disabled={formDisabled}
      />
      <p className="mb-4 text-[12px] text-[#94a3b8]">
        Defaults to {tomorrowDateKey(timezone)} in {timezoneLabel(timezone)} if
        left blank.
      </p>

      <InputField
        label="Posting time"
        type="time"
        fieldClassName="mb-4"
        value={form.postingTime}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            postingTime: event.target.value,
          }))
        }
        disabled={formDisabled}
      />

      <label className={appLabel}>Posting days</label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {POSTING_DAY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={pillVariant(form.postingDays.includes(option.value))}
            size="xs"
            disabled={formDisabled}
            onClick={() => togglePostingDay(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <TextareaField
        label="Notes"
        hint="(optional)"
        fieldClassName="mb-4"
        className="h-20"
        value={form.additionalContext}
        placeholder="Themes, campaigns, or angles to weave into the calendar…"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            additionalContext: event.target.value,
          }))
        }
        disabled={formDisabled}
      />

      <Button
        type="button"
        variant="gradient"
        size="lg"
        fullWidth
        onClick={() => void runGenerate()}
        disabled={!canSubmit}
      >
        <MsIcon name="calendar_month" size={19} />
        {isRunning
          ? "Generating calendar…"
          : `Generate calendar (${creditCost} credits)`}
      </Button>
    </>
  );

  return (
    <div className="pp-gen">
      <div className="sticky top-[90px] rounded-[18px] border border-[#eceef4] bg-white p-[22px]">
        <div className="mb-[18px] flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-[#0891b2] to-[#4f46e5]">
            <MsIcon name="calendar_month" size={21} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold">
              Bulk calendar generation
            </h2>
            <p className="text-[12.5px] text-[#94a3b8]">
              Plan 7 or 30 posts with topics and scheduled slots.
            </p>
          </div>
        </div>

        <QueryState
          isLoading={profilesLoading}
          error={profilesError}
          isEmpty={(profiles?.length ?? 0) === 0}
          empty={
            <div className="rounded-[12px] border border-dashed border-[#d8dce8] bg-[#fbfbfd] px-4 py-5 text-center">
              <p className="mb-3 text-[13px] leading-relaxed text-[#64748b]">
                Create a content profile before generating a calendar.
              </p>
              <Link
                href="/app/profile"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5]"
              >
                Set up content profile
                <MsIcon name="arrow_forward" size={16} />
              </Link>
            </div>
          }
          onRetry={() => void refetchProfiles()}
        >
          {formPanel}
          <GenerationHistoryPanel
            history={history}
            onRestore={handleRestoreHistory}
            emptyMessage="Recent calendar generations will appear here."
          />
        </QueryState>
      </div>

      <div>
        {generateError && !activeCalendarJobId ? (
          <div className="mb-4 rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[13px] text-[#b91c1c]">
            {generateError}
          </div>
        ) : null}

        {isRunning && !calendarJob.data ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0891b2]">
              <MsIcon name="progress_activity" size={20} className="animate-ppspin" />
              Starting calendar generation…
            </div>
            <div className="rounded-2xl border border-[#eceef4] bg-white p-[22px]">
              <div className="animate-ppshimmer mb-4 h-3.5 w-[60%] rounded-md" />
              <div className="animate-ppshimmer mb-2 h-2.5 w-full rounded-md" />
              <div className="animate-ppshimmer h-2.5 w-[80%] rounded-md" />
            </div>
          </div>
        ) : activeCalendarJobId && calendarJob.data ? (
          <CalendarJobProgressPanel
            progress={calendarJob.data.progress}
            status={calendarJob.data.status}
            errorMessage={calendarJob.data.errorMessage}
            result={calendarResult}
            timezone={timezone}
          />
        ) : (
          <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#d8dce8] bg-white px-8 py-14 text-center">
            <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ecfeff] to-[#eef2ff]">
              <MsIcon name="calendar_month" size={34} className="text-[#0891b2]" />
            </div>
            <h3 className="mb-2 font-display text-[19px] font-bold">
              Your calendar plan will appear here
            </h3>
            <p className="mb-[22px] max-w-[360px] text-[14.5px] leading-relaxed text-[#64748b]">
              Generate a week or month of LinkedIn posts with topics and
              scheduled slots, ready for your approval.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void runGenerate()}
              disabled={!canSubmit}
            >
              <MsIcon name="calendar_month" size={18} />
              Generate calendar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
