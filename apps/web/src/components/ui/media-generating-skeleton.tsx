"use client";

import { MsIcon } from "@/components/ui/ms-icon";

type MediaGeneratingSkeletonProps = {
  label?: string;
  className?: string;
};

export function MediaGeneratingSkeleton({
  label = "Generating media…",
  className = "mb-4",
}: MediaGeneratingSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#e8ebf2] bg-[#f8f9fc] ${className}`}
      style={{ aspectRatio: "16 / 9", minHeight: 180 }}
    >
      <div className="absolute inset-0 animate-ppshimmer opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <MsIcon
          name="progress_activity"
          size={28}
          className="animate-ppspin text-[#6366f1]"
        />
        <span className="text-[13px] font-semibold text-[#475569]">{label}</span>
      </div>
    </div>
  );
}
