"use client";

import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import type { ConfirmConfig } from "@/providers/app-ui-provider";

type ConfirmDialogProps = {
  config: ConfirmConfig;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ config, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div
      className="animate-ppfade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="animate-ppscale w-full max-w-[420px] rounded-[20px] bg-white p-7 shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <ModalHeader
          icon={config.icon}
          title={config.title}
          tone={config.tone === "danger" ? "danger" : "neutral"}
        />
        <p className="mb-6 text-[14.5px] leading-[1.6] text-[#64748b]">
          {config.body}
        </p>
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="muted"
            size="modal"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={config.tone === "danger" ? "destructive" : "primary"}
            size="modal"
            className="flex-1"
            onClick={onConfirm}
          >
            {config.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
