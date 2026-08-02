"use client";

import type { ApiPostMedia } from "@/lib/api/types/post";

type PostMediaThumbnailProps = {
  media: ApiPostMedia[] | undefined;
  className?: string;
};

export function PostMediaThumbnail({
  media,
  className = "",
}: PostMediaThumbnailProps) {
  const first = media?.[0];
  if (!first) return null;

  const count = media?.length ?? 0;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md bg-[#eef1f6] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={first.url}
        alt={first.altText || "Post media"}
        className="h-full w-full object-cover"
      />
      {count > 1 ? (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 text-[9px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </div>
  );
}
