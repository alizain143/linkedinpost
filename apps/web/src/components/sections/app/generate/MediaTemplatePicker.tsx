"use client";

import {
  DEFAULT_MEDIA_TEMPLATE_ID,
  MEDIA_TEMPLATE_CATALOG,
  type MediaTemplateId,
} from "@/lib/media-template-catalog";

type MediaTemplatePickerProps = {
  value: string;
  onChange: (templateId: MediaTemplateId) => void;
  disabled?: boolean;
};

function TemplatePreview({
  bg,
  accent,
  text,
  variant,
}: {
  bg: string;
  accent: string;
  text: string;
  variant: MediaTemplateId;
}) {
  const isDark = bg === "#1a1a2e" || bg === "#0f172a" || bg === "#111827";

  return (
    <div
      className="relative h-[72px] w-full overflow-hidden rounded-md border border-black/5"
      style={{ background: bg }}
    >
      <div className="flex items-center justify-between px-2 pt-1.5">
        <div className="flex items-center gap-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: isDark ? "#ffffff33" : "#e2e8f0" }}
          />
          <div
            className="h-1 w-8 rounded"
            style={{ background: text, opacity: 0.85 }}
          />
        </div>
        <div
          className="h-1 w-10 rounded"
          style={{ background: text, opacity: 0.45 }}
        />
      </div>

      {variant === "linkedin_educational" ? (
        <div className="px-2 pt-2 text-center">
          <div className="mx-auto h-1.5 w-[70%] rounded" style={{ background: text }} />
          <div
            className="mx-auto mt-1 h-1 w-[40%] rounded"
            style={{ background: accent }}
          />
          <div className="mt-2 flex justify-center gap-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-4 w-5 rounded-sm border"
                style={{
                  borderColor: isDark ? "#ffffff22" : "#e2e8f0",
                  background: isDark ? "#ffffff11" : "#ffffff",
                }}
              />
            ))}
          </div>
        </div>
      ) : variant === "linkedin_stat" ? (
        <div className="flex h-full flex-col items-center justify-center pt-1">
          <div className="h-3 w-10 rounded" style={{ background: accent }} />
          <div
            className="mt-1 h-1 w-14 rounded"
            style={{ background: text, opacity: 0.5 }}
          />
        </div>
      ) : variant === "linkedin_tips" ? (
        <div className="space-y-1 px-3 pt-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="h-1 w-1 rounded-full" style={{ background: accent }} />
              <div
                className="h-1 flex-1 rounded"
                style={{ background: text, opacity: 0.55 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center px-3">
          <div
            className="h-1.5 w-[80%] rounded"
            style={{ background: text, opacity: variant === "linkedin_quote_dark" ? 0.9 : 0.75 }}
          />
        </div>
      )}
    </div>
  );
}

export function MediaTemplatePicker({
  value,
  onChange,
  disabled,
}: MediaTemplatePickerProps) {
  const selected = value || DEFAULT_MEDIA_TEMPLATE_ID;

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Post image template</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Pre-built LinkedIn layouts — deterministic, not AI-generated.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MEDIA_TEMPLATE_CATALOG.map((template) => {
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(template.id)}
              className={`rounded-xl border p-2.5 text-left transition ${
                isSelected
                  ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-200"
                  : "border-border bg-card hover:border-violet-200"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <TemplatePreview
                bg={template.preview.bg}
                accent={template.preview.accent}
                text={template.preview.text}
                variant={template.id}
              />
              <p className="mt-2 text-[13px] font-semibold">{template.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
