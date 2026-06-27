"use client";

import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { TextareaField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TONE_ADJUSTMENT_OPTIONS } from "@/lib/form-options";

type RequestChangesModalProps = {
  onClose: () => void;
  onSubmit: () => void;
};

export function RequestChangesModal({ onClose, onSubmit }: RequestChangesModalProps) {
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
          Tell the AI Council what to change. It will revise the post and re-score
          it.
        </p>

        <TextareaField
          label="What should change?"
          fieldClassName="mb-3.5"
          variant="marketing"
          className="h-24 text-[13.5px]"
          placeholder="Make it more founder-style, less formal, and add a stronger opening hook."
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <SelectField
            label="Tone adjustment"
            selectClassName="text-[13px]"
            options={TONE_ADJUSTMENT_OPTIONS}
            defaultValue="Keep current"
          />
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2.5 text-[13px] text-[#475569]">
            <input type="checkbox" className="h-[15px] w-[15px] accent-[#4f46e5]" />
            Regenerate media too
          </label>
        </div>

        <div className="flex gap-2.5">
          <Button type="button" variant="muted" size="modal" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="modal" className="flex-1" onClick={onSubmit}>
            <MsIcon name="send" size={17} />
            Send to AI Council
          </Button>
        </div>
      </div>
    </div>
  );
}
