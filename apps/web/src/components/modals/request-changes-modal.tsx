"use client";

import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";

type RequestChangesModalProps = {
  open: boolean;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export function RequestChangesModal({
  open,
  feedback,
  onFeedbackChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: RequestChangesModalProps) {
  if (!open) return null;

  return (
    <div
      className="animate-ppfade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-ppscale w-full max-w-[480px] rounded-[20px] bg-white p-[26px] shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <ModalHeader icon="rate_review" title="Request changes" tone="warning" />
        <p className="mb-4 text-[13.5px] leading-[1.5] text-[#64748b]">
          Send this post back to draft with your feedback so it can be revised.
        </p>

        <TextareaField
          label="What should change?"
          fieldClassName="mb-3.5"
          variant="marketing"
          className="h-24 text-[13.5px]"
          placeholder="Make it more founder-style, less formal, and add a stronger opening hook."
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          disabled={isSubmitting}
        />

        {errorMessage ? (
          <p className="mb-3 text-[13px] text-[#dc2626]">{errorMessage}</p>
        ) : null}

        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="muted"
            size="modal"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="modal"
            className="flex-1"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            <MsIcon name="send" size={17} />
            {isSubmitting ? "Sending…" : "Send feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}
