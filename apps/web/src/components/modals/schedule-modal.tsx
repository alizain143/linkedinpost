"use client";

import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";

type ScheduleModalProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export function ScheduleModal({ onClose, onConfirm }: ScheduleModalProps) {
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
        <ModalHeader icon="event_available" title="Approve & schedule" />

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
            Maya Reyes
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <InputField
            label="Date"
            variant="modal"
            readOnly
            defaultValue="Jun 30, 2026"
          />
          <InputField
            label="Time"
            variant="modal"
            readOnly
            defaultValue="9:00 AM"
          />
        </div>

        <div className="flex gap-2.5">
          <Button type="button" variant="muted" size="modal" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="success" size="modal" className="flex-1" onClick={onConfirm}>
            Confirm schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
