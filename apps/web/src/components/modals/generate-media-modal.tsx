"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { VoiceMicButton } from "@/components/ui/voice-mic-button";
import {
  MEDIA_GENERATION_CREDIT_COST,
  MEDIA_TEMPLATE_CREDIT_COST,
} from "@/lib/credit-costs";

export type GenerateMediaModalValues = {
  mediaTemplateId: string;
  direction: string;
};

type GenerateMediaModalProps = {
  open: boolean;
  title?: string;
  confirmLabel?: string;
  values: GenerateMediaModalValues;
  templateOptions: { value: string; label: string }[];
  isSubmitting?: boolean;
  onChange: (patch: Partial<GenerateMediaModalValues>) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function GenerateMediaModal({
  open,
  title = "Generate media",
  confirmLabel = "Generate",
  values,
  templateOptions,
  isSubmitting,
  onChange,
  onClose,
  onConfirm,
}: GenerateMediaModalProps) {
  const titleId = useId();
  const directionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const usesTemplate = Boolean(values.mediaTemplateId);
  const creditCost = usesTemplate
    ? MEDIA_TEMPLATE_CREDIT_COST
    : MEDIA_GENERATION_CREDIT_COST;

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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#eceef4] bg-white p-5 shadow-xl"
      >
        <h3 id={titleId} className="font-display text-[17px] font-bold text-[#0f172a]">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748b]">
          Pick a template for the image layout, or add optional direction for
          the AI.
        </p>

        <div className="mt-4 space-y-3">
          <SelectField
            label="Template"
            options={
              templateOptions.length > 0
                ? templateOptions
                : [{ value: "", label: "No templates — freestyle image" }]
            }
            value={values.mediaTemplateId}
            onChange={(event) =>
              onChange({ mediaTemplateId: event.target.value })
            }
            disabled={isSubmitting || templateOptions.length === 0}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor={directionId}
                className="text-[12px] font-semibold text-[#64748b]"
              >
                Image direction{" "}
                <span className="font-normal text-[#94a3b8]">(optional)</span>
              </label>
              <VoiceMicButton
                disabled={isSubmitting}
                value={values.direction}
                onChange={(direction) => onChange({ direction })}
              />
            </div>
            <textarea
              id={directionId}
              className="h-24 w-full resize-none rounded-[11px] border border-[#e3e6ef] bg-white px-3 py-2.5 text-[13.5px] text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#4f46e5] disabled:opacity-60"
              value={values.direction}
              maxLength={5000}
              placeholder="Minimal dark layout, gold accent, professional LinkedIn feed style…"
              onChange={(event) => onChange({ direction: event.target.value })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <p className="mt-2 text-[12px] text-[#94a3b8]">
          Uses {creditCost} credit{creditCost === 1 ? "" : "s"}
          {usesTemplate ? " (template layout)" : " (freestyle image)"}
        </p>

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
            {isSubmitting ? "Starting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
