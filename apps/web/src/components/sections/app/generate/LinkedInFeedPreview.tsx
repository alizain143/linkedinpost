"use client";

import { PostMediaImage } from "@/components/ui/post-media-image";

type LinkedInFeedPreviewProps = {
  authorName: string;
  roleTitle?: string | null;
  hook: string;
  body?: string | null;
  mediaUrl?: string | null;
};

export function LinkedInFeedPreview({
  authorName,
  roleTitle,
  hook,
  body,
  mediaUrl,
}: LinkedInFeedPreviewProps) {
  const previewBody = body?.trim() ? `${hook}\n\n${body}` : hook;

  return (
    <div className="rounded-xl border border-border bg-white p-4 text-left shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
          {authorName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{authorName}</p>
          {roleTitle ? (
            <p className="text-xs text-gray-500">{roleTitle}</p>
          ) : null}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
        {previewBody}
      </p>
      {mediaUrl ? (
        <PostMediaImage
          className="mt-3 rounded-lg border-gray-200"
          src={mediaUrl}
          alt="Post media preview"
        />
      ) : null}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>Like</span>
        <span>Comment</span>
        <span>Repost</span>
        <span>Send</span>
      </div>
    </div>
  );
}
