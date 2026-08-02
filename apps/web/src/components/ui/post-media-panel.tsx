"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  PostMediaCarouselViewer,
  PostMediaList,
} from "@/components/ui/post-media-image";
import { MediaGeneratingSkeleton } from "@/components/ui/media-generating-skeleton";
import { appMuted } from "@/components/app/app-ui";
import type { ApiPostMedia } from "@/lib/api/types/post";
import {
  getPostMediaAccept,
  POST_MEDIA_MAX_FILES,
  validatePostMediaFiles,
} from "@/lib/media/post-media-upload";

type PostMediaPanelProps = {
  media: ApiPostMedia[];
  isEditable: boolean;
  isMediaGenerating: boolean;
  mediaCreditCost: number;
  isUploading?: boolean;
  onGenerate: () => void;
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onClearMedia?: () => void | Promise<void>;
  isClearing?: boolean;
  showCarouselViewer?: boolean;
};

export function PostMediaPanel({
  media,
  isEditable,
  isMediaGenerating,
  mediaCreditCost,
  isUploading = false,
  onGenerate,
  onUploadFiles,
  onClearMedia,
  isClearing = false,
  showCarouselViewer = false,
}: PostMediaPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = isMediaGenerating || isUploading || isClearing;
  const hasMedia = media.length > 0;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, POST_MEDIA_MAX_FILES);
    const error = validatePostMediaFiles(files);
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    void onUploadFiles(files);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0f172a]">
          Media
        </h3>
        {isEditable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <MsIcon
                name={isUploading ? "progress_activity" : "upload"}
                size={16}
                className={isUploading ? "animate-ppspin" : undefined}
              />
              {isUploading
                ? "Uploading…"
                : hasMedia
                  ? "Replace with upload"
                  : "Upload images"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={onGenerate}
            >
              <MsIcon
                name={isMediaGenerating ? "progress_activity" : "auto_awesome"}
                size={16}
                className={isMediaGenerating ? "animate-ppspin" : undefined}
              />
              {isMediaGenerating
                ? "Generating…"
                : hasMedia
                  ? `Generate AI (${mediaCreditCost} cr)`
                  : `Generate AI (${mediaCreditCost} cr)`}
            </Button>
            {hasMedia && onClearMedia ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void onClearMedia()}
              >
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={getPostMediaAccept()}
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {isEditable ? (
        <div
          className={`mb-4 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
            dragOver
              ? "border-[#5b3df5] bg-[#f5f3ff]"
              : "border-[#e2e8f0] bg-[#fafbfc]"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-[13px] text-[#475569]">
            Drop JPEG/PNG images here (1–{POST_MEDIA_MAX_FILES}). Upload replaces
            current media.
          </p>
        </div>
      ) : null}

      {localError ? (
        <p className="mb-3 text-[13px] text-[#dc2626]">{localError}</p>
      ) : null}

      {!hasMedia && !isMediaGenerating ? (
        <p className={`${appMuted} mb-4 text-[13px]`}>
          No media yet. Upload your own images or generate with AI.
        </p>
      ) : null}

      {isMediaGenerating && !hasMedia ? (
        <MediaGeneratingSkeleton label="Generating media…" />
      ) : hasMedia ? (
        showCarouselViewer && media.length > 1 ? (
          <PostMediaCarouselViewer items={media} />
        ) : (
          <PostMediaList items={media} />
        )
      ) : null}
    </div>
  );
}
