"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CreditConfirmModalProps = {
  open: boolean;
  cost: number;
  actionLabel: string;
  onClose: () => void;
  onConfirm: (skipFuture: boolean) => void;
};

export function CreditConfirmModal({
  open,
  cost,
  actionLabel,
  onClose,
  onConfirm,
}: CreditConfirmModalProps) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [skipFuture, setSkipFuture] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSkipFuture(false);
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-[#eceef4] bg-white p-5 shadow-xl"
      >
        <h3 id={titleId} className="font-display text-[17px] font-bold text-[#0f172a]">
          Use {cost} credit{cost === 1 ? "" : "s"}?
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
          {actionLabel} uses {cost} credit{cost === 1 ? "" : "s"}. Continue?
        </p>
        <label className="mt-4 flex items-center gap-2 text-[12.5px] text-[#475569]">
          <input
            type="checkbox"
            checked={skipFuture}
            onChange={(event) => setSkipFuture(event.target.checked)}
          />
          Don&apos;t ask again this session
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onConfirm(skipFuture)}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
