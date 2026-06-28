"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import type { ScheduleTarget } from "@/lib/api/types/scheduling";
import {
  DEFAULT_SCHEDULE_TIME,
  formatScheduleFormValue,
  getDefaultScheduleDateKey,
  getScheduleDateInputMax,
  getScheduleDateInputMin,
  parseScheduleFormValue,
  validateScheduleAt,
} from "@/lib/schedule-utils";

type ScheduleModalProps = {
  target: ScheduleTarget;
  profileName: string | null;
  timezone: string;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
};

export function ScheduleModal({
  target,
  profileName,
  timezone,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: ScheduleModalProps) {
  const initialValues = useMemo(() => {
    if (target.mode === "reschedule" && target.scheduledAt) {
      return formatScheduleFormValue(target.scheduledAt, timezone);
    }
    return {
      dateKey: getDefaultScheduleDateKey(timezone),
      time: DEFAULT_SCHEDULE_TIME,
    };
  }, [target.mode, target.scheduledAt, timezone]);

  const [dateKey, setDateKey] = useState(initialValues.dateKey);
  const [time, setTime] = useState(initialValues.time);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDateKey(initialValues.dateKey);
    setTime(initialValues.time);
    setValidationError(null);
  }, [initialValues.dateKey, initialValues.time, target.postId]);

  const title =
    target.mode === "reschedule" ? "Reschedule post" : "Schedule post";

  const handleConfirm = () => {
    if (!dateKey || !time) {
      setValidationError("Pick a date and time to schedule this post.");
      return;
    }

    const scheduledAt = parseScheduleFormValue(dateKey, time, timezone);
    const clientError = validateScheduleAt(scheduledAt);
    if (clientError) {
      setValidationError(clientError);
      return;
    }

    setValidationError(null);
    onConfirm(scheduledAt);
  };

  const displayError = validationError ?? error;

  return (
    <div
      className="animate-ppfade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-ppscale w-full max-w-[430px] rounded-[20px] bg-white p-[26px] shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <ModalHeader icon="event_available" title={title} />

        <p className="mb-3.5 truncate text-[13px] font-semibold text-[#1e293b]">
          {target.hook}
        </p>

        <label className="mb-[7px] block text-[12.5px] font-semibold text-[#475569]">
          LinkedIn account
        </label>
        <div className="mb-3.5 flex items-center gap-2.5 rounded-[11px] border border-[#e7e9f2] bg-[#f8f9fc] px-[13px] py-[11px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#0a66c2]">
            <span className="font-display text-[13px] font-extrabold text-white">
              in
            </span>
          </div>
          <span className="text-[13.5px] font-semibold text-[#1e293b]">
            {profileName ?? "LinkedIn member"}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <InputField
            label="Date"
            variant="modal"
            type="date"
            value={dateKey}
            min={getScheduleDateInputMin(timezone)}
            max={getScheduleDateInputMax(timezone)}
            onChange={(event) => setDateKey(event.target.value)}
          />
          <InputField
            label="Time"
            variant="modal"
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        {displayError ? (
          <p className="mb-4 text-[13px] font-medium text-[#dc2626]">
            {displayError}
          </p>
        ) : null}

        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="muted"
            size="modal"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="success"
            size="modal"
            className="flex-1"
            disabled={isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? "Saving…" : "Confirm schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
