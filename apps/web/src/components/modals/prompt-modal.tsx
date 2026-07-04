"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VoiceMicButton } from "@/components/ui/voice-mic-button";

type PromptModalProps = {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  creditCost?: number;
};

export function PromptModal({
  open,
  title,
  description,
  placeholder,
  confirmLabel,
  value,
  onChange,
  onClose,
  onConfirm,
  isSubmitting,
  creditCost,
}: PromptModalProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-[#eceef4] bg-white p-5 shadow-xl"
      >
        <h3 id={titleId} className="font-display text-[17px] font-bold text-[#0f172a]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748b]">
            {description}
          </p>
        ) : null}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-[#64748b]">
              Direction{" "}
              <span className="font-normal text-[#94a3b8]">(optional)</span>
            </span>
            <VoiceMicButton
              disabled={isSubmitting}
              value={value}
              onChange={onChange}
            />
          </div>
          <textarea
            className="h-24 w-full resize-none rounded-[11px] border border-[#e3e6ef] bg-white px-3 py-2.5 text-[13.5px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#4f46e5] disabled:opacity-60"
            value={value}
            maxLength={2000}
            placeholder={placeholder ?? "What should change?"}
            onChange={(event) => onChange(event.target.value)}
            disabled={isSubmitting}
            aria-label="Direction"
          />
        </div>
        {creditCost != null ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">
            Uses {creditCost} credit{creditCost === 1 ? "" : "s"}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
