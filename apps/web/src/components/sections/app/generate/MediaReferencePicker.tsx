"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { MediaTemplatePicker } from "@/components/sections/app/generate/MediaTemplatePicker";
import type { PostMediaType } from "@/lib/api/types/enums";
import type { MediaReferenceCandidate } from "@/lib/api/types/media-references";
import {
  DEFAULT_MEDIA_TEMPLATE_ID,
  getTemplateDefinition,
  type MediaTemplateId,
} from "@/lib/media-template-catalog";
import { MEDIA_TYPE_OPTIONS } from "@/lib/media-types";

type MediaReferencePickerProps = {
  candidates: MediaReferenceCandidate[];
  mediaType?: PostMediaType;
  mediaCustomPrompt: string;
  mediaTemplateId: string;
  onMediaTypeChange: (value: PostMediaType) => void;
  onCustomPromptChange: (value: string) => void;
  onTemplateChange: (value: MediaTemplateId) => void;
  onContinue: (selectedUrls: string[]) => void;
  isSubmitting?: boolean;
};

export function MediaReferencePicker({
  candidates,
  mediaType,
  mediaCustomPrompt,
  mediaTemplateId,
  onMediaTypeChange,
  onCustomPromptChange,
  onTemplateChange,
  onContinue,
  isSubmitting,
}: MediaReferencePickerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(url: string) {
    setSelected((current) => {
      if (current.includes(url)) {
        return current.filter((item) => item !== url);
      }
      if (current.length >= 3) return current;
      return [...current, url];
    });
  }

  function handleTemplateChange(templateId: MediaTemplateId) {
    const templateDef = getTemplateDefinition(templateId);
    onTemplateChange(templateId);
    if (templateDef) {
      onMediaTypeChange(templateDef.mediaType);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-1 text-sm font-semibold">Pick reference images</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Select up to 3 images to inspire your generated media (not posted directly).
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {candidates.map((candidate) => {
          const isSelected = selected.includes(candidate.url);
          return (
            <button
              key={candidate.url}
              type="button"
              className={`overflow-hidden rounded-lg border text-left transition ${
                isSelected ? "border-violet-500 ring-2 ring-violet-300" : "border-border"
              }`}
              onClick={() => toggle(candidate.url)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={candidate.thumbnailUrl}
                alt={candidate.title}
                className="h-24 w-full object-cover"
              />
              <p className="truncate p-2 text-[11px] text-muted-foreground">
                {candidate.title}
              </p>
            </button>
          );
        })}
      </div>

      <MediaTemplatePicker
        value={mediaTemplateId || DEFAULT_MEDIA_TEMPLATE_ID}
        onChange={handleTemplateChange}
        disabled={isSubmitting}
      />

      <SelectField
        label="Media type"
        fieldClassName="mt-4"
        value={mediaType ?? "branded_quote_card"}
        onChange={(event) =>
          onMediaTypeChange(event.target.value as PostMediaType)
        }
        options={MEDIA_TYPE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />

      <TextareaField
        label="Custom media prompt (optional)"
        fieldClassName="mt-3"
        value={mediaCustomPrompt}
        maxLength={500}
        placeholder="Dark minimal background, gold accents, professional mood..."
        onChange={(event) => onCustomPromptChange(event.target.value)}
      />

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={isSubmitting}
          onClick={() => onContinue(selected)}
        >
          Continue generation
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => onContinue([])}
        >
          Skip references
        </Button>
      </div>
    </div>
  );
}
