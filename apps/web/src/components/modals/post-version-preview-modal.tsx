"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PostMediaImage } from "@/components/ui/post-media-image";
import type { ApiPostMedia, ApiPostVersion } from "@/lib/api/types/post";

type PostTextVersionPreviewModalProps = {
  open: boolean;
  version: ApiPostVersion | null;
  isCurrent: boolean;
  isApplying?: boolean;
  onClose: () => void;
  onApply?: () => void;
};

export function PostTextVersionPreviewModal({
  open,
  version,
  isCurrent,
  isApplying,
  onClose,
  onApply,
}: PostTextVersionPreviewModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  if (!open || !version) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#eceef4] bg-white shadow-xl"
      >
        <div className="border-b border-[#f1f3f8] px-5 py-4">
          <h3 id={titleId} className="font-display text-[17px] font-bold text-[#0f172a]">
            Version {version.versionNumber}
          </h3>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Preview this text version before restoring it to the post.
          </p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
              Hook
            </span>
            <p className="text-[15px] font-semibold leading-snug text-[#0f172a]">
              {version.hook ?? "Untitled"}
            </p>
          </div>
          {version.body ? (
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
                Body
              </span>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3f4a5e]">
                {version.body}
              </p>
            </div>
          ) : null}
          {version.cta ? (
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
                CTA
              </span>
              <p className="text-sm font-medium text-[#1e293b]">{version.cta}</p>
            </div>
          ) : null}
          {version.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {version.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#475569]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#f1f3f8] px-5 py-4">
          <Button ref={closeRef} type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {!isCurrent && onApply ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isApplying}
              onClick={onApply}
            >
              {isApplying ? "Applying…" : "Use this version"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type PostMediaVersionPreviewModalProps = {
  open: boolean;
  media: ApiPostMedia | null;
  versionNumber: number;
  isCurrent: boolean;
  isApplying?: boolean;
  onClose: () => void;
  onApply?: () => void;
};

export function PostMediaVersionPreviewModal({
  open,
  media,
  versionNumber,
  isCurrent,
  isApplying,
  onClose,
  onApply,
}: PostMediaVersionPreviewModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  if (!open || !media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#eceef4] bg-white shadow-xl"
      >
        <div className="border-b border-[#f1f3f8] px-5 py-4">
          <h3 id={titleId} className="font-display text-[17px] font-bold text-[#0f172a]">
            Media version {versionNumber}
          </h3>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Preview this generated image before making it the active post media.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <PostMediaImage
            src={media.url}
            alt={media.altText || "Post media version"}
            href={media.url}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-[#f1f3f8] px-5 py-4">
          <Button ref={closeRef} type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {!isCurrent && onApply ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isApplying}
              onClick={onApply}
            >
              {isApplying ? "Applying…" : "Use this version"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
