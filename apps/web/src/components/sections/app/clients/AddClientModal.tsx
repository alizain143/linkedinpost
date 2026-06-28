"use client";

import { useEffect, useState } from "react";
import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import type { CreateClientWorkspaceBody } from "@/lib/api/types/workspace";

type AddClientModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateClientWorkspaceBody) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

type FormState = {
  name: string;
  industry: string;
  targetAudience: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  industry: "",
  targetAudience: "",
};

export function AddClientModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: AddClientModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    const name = form.name.trim();
    if (!name) return;

    const profile =
      form.industry.trim() || form.targetAudience.trim()
        ? {
            ...(form.industry.trim()
              ? { industry: form.industry.trim() }
              : {}),
            ...(form.targetAudience.trim()
              ? { targetAudience: form.targetAudience.trim() }
              : {}),
          }
        : undefined;

    onSubmit({
      name,
      ...(profile ? { profile } : {}),
    });
  };

  return (
    <div
      className="animate-ppfade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-ppscale w-full max-w-[480px] rounded-[20px] bg-white p-[26px] shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <ModalHeader icon="groups" title="Add client workspace" />
        <p className="mb-4 text-[13.5px] leading-[1.5] text-[#64748b]">
          Create a dedicated workspace for a client with its own content profile,
          pipeline, and calendar.
        </p>

        <InputField
          label="Client name"
          fieldClassName="mb-3.5"
          variant="app-sm"
          placeholder="Acme Corp"
          value={form.name}
          maxLength={200}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
          disabled={isSubmitting}
        />
        <InputField
          label="Industry"
          hint="(optional)"
          fieldClassName="mb-3.5"
          variant="app-sm"
          placeholder="B2B SaaS"
          value={form.industry}
          maxLength={200}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, industry: event.target.value }))
          }
          disabled={isSubmitting}
        />
        <InputField
          label="Target audience"
          hint="(optional)"
          fieldClassName="mb-3.5"
          variant="app-sm"
          placeholder="Early-stage founders"
          value={form.targetAudience}
          maxLength={500}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              targetAudience: event.target.value,
            }))
          }
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
            onClick={handleSubmit}
            disabled={isSubmitting || !form.name.trim()}
          >
            <MsIcon name="add" size={17} />
            {isSubmitting ? "Creating…" : "Create client"}
          </Button>
        </div>
      </div>
    </div>
  );
}
