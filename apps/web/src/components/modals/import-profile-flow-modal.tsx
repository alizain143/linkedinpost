"use client";

import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { LinkedInImportPreview } from "@/lib/linkedin-extension-bridge";

export type ImportProfileFlowStep =
  | "checking"
  | "profile-url"
  | "preparing"
  | "opening"
  | "waiting"
  | "extracting"
  | "preview"
  | "saving"
  | "error";

type ImportProfileFlowModalProps = {
  open: boolean;
  step: ImportProfileFlowStep;
  errorMessage?: string | null;
  preview: LinkedInImportPreview | null;
  profileUrlInput?: string;
  connectedProfileName?: string | null;
  onProfileUrlChange?: (value: string) => void;
  onProfileUrlContinue?: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReimport: () => void;
  onRetry: () => void;
};

export function ImportProfileFlowModal({
  open,
  step,
  errorMessage,
  preview,
  profileUrlInput = "",
  connectedProfileName,
  onProfileUrlChange,
  onProfileUrlContinue,
  onCancel,
  onSave,
  onReimport,
  onRetry,
}: ImportProfileFlowModalProps) {
  const titleId = useId();
  const profileUrlFieldId = useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#eceef4] bg-white p-5 shadow-xl"
      >
        <h3 id={titleId} className="font-display text-[17px] font-bold text-[#0f172a]">
          {step === "preview" ? "Review imported profile" : "Import LinkedIn profile"}
        </h3>

        {step === "checking" ? (
          <p className="mt-2 text-sm text-[#64748b]">Checking for Chrome extension…</p>
        ) : null}

        {step === "profile-url" ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-relaxed text-[#64748b]">
              {connectedProfileName ? (
                <>
                  LinkedIn is connected as <strong>{connectedProfileName}</strong>,
                  but we don&apos;t have their profile link yet. Paste the client&apos;s
                  LinkedIn profile URL so we open the right page — not whoever is
                  logged into Chrome.
                </>
              ) : (
                <>
                  Paste the LinkedIn profile URL for this workspace so we open the
                  correct profile page.
                </>
              )}
            </p>
            <label
              htmlFor={profileUrlFieldId}
              className="block text-xs font-semibold uppercase tracking-wide text-[#94a3b8]"
            >
              LinkedIn profile URL
            </label>
            <input
              id={profileUrlFieldId}
              type="url"
              value={profileUrlInput}
              onChange={(event) => onProfileUrlChange?.(event.target.value)}
              placeholder="https://www.linkedin.com/in/your-client"
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm text-[#0f172a] outline-none ring-[#6366f1] focus:ring-2"
            />
            {errorMessage ? (
              <p className="text-sm text-[#dc2626]">{errorMessage}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={onProfileUrlContinue}>
                Continue import
              </Button>
            </div>
          </div>
        ) : null}

        {step === "preparing" ? (
          <p className="mt-2 text-sm text-[#64748b]">Preparing secure import…</p>
        ) : null}

        {step === "opening" ? (
          <p className="mt-2 text-sm text-[#64748b]">Opening your LinkedIn profile…</p>
        ) : null}

        {step === "waiting" ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-relaxed text-[#64748b]">
              Opening the LinkedIn profile connected to this workspace (not your
              personal Chrome login). You&apos;ll return here automatically to
              review before saving.
            </p>
            <div className="rounded-lg border border-[#eceef4] bg-[#f8f9fc] p-3 text-xs text-[#64748b]">
              Expanding sections and capturing your profile…
            </div>
          </div>
        ) : null}

        {step === "extracting" ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-relaxed text-[#64748b]">
              Extracting your profile with AI. This usually takes 15–60 seconds.
            </p>
            <div className="rounded-lg border border-[#eceef4] bg-[#f8f9fc] p-3 text-xs text-[#64748b]">
              Keep this tab open while we parse headline, about, experience, and
              education from your LinkedIn page.
            </div>
          </div>
        ) : null}

        {step === "saving" ? (
          <p className="mt-2 text-sm text-[#64748b]">Saving profile to your workspace…</p>
        ) : null}

        {step === "error" ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-[#dc2626]">
              {errorMessage ?? "Something went wrong. Try again."}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}

        {step === "preview" && preview ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[#64748b]">
              Here is what we fetched. Save to update your workspace, or re-import
              if something looks wrong.
            </p>
            <ImportPreviewCard data={preview} />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {step === "preview" ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={onReimport}>
                Re-import
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={onSave}>
                Save profile
              </Button>
            </>
          ) : step === "profile-url" ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={step === "saving"}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  label,
  emptyLabel,
  hasContent,
  children,
}: {
  label: string;
  emptyLabel: string;
  hasContent: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
        {label}
      </div>
      {hasContent ? (
        <div className="mt-1 text-[#475569]">{children}</div>
      ) : (
        <p className="mt-1 text-sm italic text-[#94a3b8]">{emptyLabel}</p>
      )}
    </div>
  );
}

function ImportPreviewCard({ data }: { data: LinkedInImportPreview }) {
  const headline = data.headline?.trim();
  const summary = data.summary?.trim();
  const positions = data.positions ?? [];
  const education = data.education ?? [];
  const skills = data.skills ?? [];

  return (
    <div className="rounded-xl border border-[#eceef4] bg-[#f8f9fc] p-3 text-sm text-[#334155]">
      <PreviewSection
        label="Headline"
        emptyLabel="No headline found"
        hasContent={Boolean(headline)}
      >
        {headline}
      </PreviewSection>

      <PreviewSection
        label="About"
        emptyLabel="No about section found"
        hasContent={Boolean(summary)}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
      </PreviewSection>

      <PreviewSection
        label={`Experience${positions.length > 0 ? ` (${positions.length})` : ""}`}
        emptyLabel="No experience found"
        hasContent={positions.length > 0}
      >
        <ul className="space-y-3">
          {positions.slice(0, 5).map((role, index) => (
            <li
              key={`${role.title}-${index}`}
              className="rounded-lg border border-[#e8ebf2] bg-white p-2.5"
            >
              <div className="font-medium text-[#0f172a]">
                {[role.title, role.companyName].filter(Boolean).join(" at ")}
              </div>
              {role.description ? (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#64748b]">
                  {role.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </PreviewSection>

      <PreviewSection
        label={`Education${education.length > 0 ? ` (${education.length})` : ""}`}
        emptyLabel="No education found"
        hasContent={education.length > 0}
      >
        <ul className="list-disc space-y-1 pl-4">
          {education.slice(0, 5).map((entry, index) => (
            <li key={`${entry.schoolName}-${index}`}>
              {[entry.schoolName, entry.degreeName].filter(Boolean).join(" — ")}
            </li>
          ))}
        </ul>
      </PreviewSection>

      <PreviewSection
        label={`Skills${skills.length > 0 ? ` (${skills.length})` : ""}`}
        emptyLabel="No skills found"
        hasContent={skills.length > 0}
      >
        <p>{skills.slice(0, 8).join(" · ")}</p>
      </PreviewSection>
    </div>
  );
}
