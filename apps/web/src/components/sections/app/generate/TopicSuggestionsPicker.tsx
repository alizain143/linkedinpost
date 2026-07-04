"use client";

import type { TopicSuggestion } from "@/lib/api/types/generation";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";

type TopicSuggestionsPickerProps = {
  suggestions: TopicSuggestion[];
  onSelect: (suggestion: TopicSuggestion) => void;
  disabled?: boolean;
  stale?: boolean;
  onRefresh?: () => void;
};

export function TopicSuggestionsPicker({
  suggestions,
  onSelect,
  disabled,
  stale,
  onRefresh,
}: TopicSuggestionsPickerProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-[#eceef4] bg-[#fafbff] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
          Suggested topics
        </p>
        {stale ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className="text-[11px] font-semibold text-[#4f46e5] hover:underline disabled:opacity-50"
          >
            Suggestions may be outdated · Refresh
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <span key={suggestion.topic} title={suggestion.rationale}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              aria-label={suggestion.rationale ?? suggestion.topic}
              className="h-auto max-w-full whitespace-normal px-3 py-1.5 text-left text-[12.5px] leading-snug"
              onClick={() => onSelect(suggestion)}
            >
              {suggestion.topic}
            </Button>
          </span>
        ))}
      </div>
    </div>
  );
}

type TopicMagicButtonProps = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  hasSuggestions?: boolean;
};

export function TopicMagicButton({
  onClick,
  loading,
  disabled,
  hasSuggestions,
}: TopicMagicButtonProps) {
  return (
    <span
      title={hasSuggestions ? "Uses AI · regenerates suggestions" : "Uses AI"}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || loading}
        aria-label={
          hasSuggestions
            ? "Regenerate topic suggestions"
            : "Suggest trending topics"
        }
        className="h-7 gap-1 px-2 text-[12px] text-[#5B3DF5] hover:bg-[#f0edff]"
        onClick={onClick}
      >
        <MsIcon
          name={loading ? "progress_activity" : "auto_awesome"}
          size={15}
          className={loading ? "animate-spin" : undefined}
        />
        {loading
          ? "Suggesting…"
          : hasSuggestions
            ? "Regenerate topics"
            : "Suggest topics"}
      </Button>
    </span>
  );
}
