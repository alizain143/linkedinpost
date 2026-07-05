"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

type PostMediaImageProps = {
  src: string;
  alt: string;
  /** When set, wraps the image in a link that opens the full asset. */
  href?: string;
  className?: string;
};

/**
 * Renders post media the way LinkedIn does in-feed: full card width,
 * natural aspect ratio, no fixed crop box.
 */
export function PostMediaImage({
  src,
  alt,
  href,
  className,
}: PostMediaImageProps) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="block h-auto w-full" />
  );

  const wrapperClass = cn(
    "block overflow-hidden rounded-xl border border-[#eceef4] bg-[#f8fafc]",
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClass}
      >
        {image}
      </a>
    );
  }

  return <div className={wrapperClass}>{image}</div>;
}

type PostMediaItem = {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

type PostMediaCarouselViewerProps = {
  items: PostMediaItem[];
  className?: string;
  /** Open the current slide in a new tab (default true). */
  linkToSource?: boolean;
};

/** One slide at a time with prev/next controls — for generate & detail previews. */
export function PostMediaCarouselViewer({
  items,
  className,
  linkToSource = true,
}: PostMediaCarouselViewerProps) {
  const sorted = useMemo(
    () =>
      [...items]
        .filter((item) => item.url)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sorted.length, sorted.map((item) => item.id ?? item.url).join("|")]);

  if (sorted.length === 0) return null;

  if (sorted.length === 1) {
    const item = sorted[0];
    return (
      <PostMediaImage
        src={item.url}
        alt={item.altText ?? "Post media"}
        href={linkToSource ? item.url : undefined}
        className={className}
      />
    );
  }

  const current = sorted[index];
  const atStart = index === 0;
  const atEnd = index === sorted.length - 1;

  return (
    <div className={cn("mb-4", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="text-[12px] font-semibold text-[#64748b]">
          Carousel · {sorted.length} slides
        </p>
        <p className="text-[12px] font-medium text-[#94a3b8]">
          {index + 1} / {sorted.length}
        </p>
      </div>
      <div className="relative">
        <PostMediaImage
          src={current.url}
          alt={current.altText ?? `Slide ${index + 1}`}
          href={linkToSource ? current.url : undefined}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Previous slide"
          disabled={atStart}
          onClick={() => setIndex((currentIndex) => Math.max(0, currentIndex - 1))}
          className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-[#e2e8f0] bg-white/95 shadow-sm backdrop-blur-sm disabled:opacity-40"
        >
          <MsIcon name="chevron_left" size={20} className="text-[#334155]" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Next slide"
          disabled={atEnd}
          onClick={() =>
            setIndex((currentIndex) =>
              Math.min(sorted.length - 1, currentIndex + 1),
            )
          }
          className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border border-[#e2e8f0] bg-white/95 shadow-sm backdrop-blur-sm disabled:opacity-40"
        >
          <MsIcon name="chevron_right" size={20} className="text-[#334155]" />
        </Button>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {sorted.map((item, dotIndex) => (
          <button
            key={item.id ?? `${item.url}-${dotIndex}`}
            type="button"
            aria-label={`Go to slide ${dotIndex + 1}`}
            onClick={() => setIndex(dotIndex)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              dotIndex === index
                ? "w-4 bg-[#4f46e5]"
                : "w-1.5 bg-[#cbd5e1] hover:bg-[#94a3b8]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

type PostMediaListProps = {
  items: PostMediaItem[];
  className?: string;
  /** Open each asset in a new tab (default true). */
  linkToSource?: boolean;
};

/** Stack or carousel strip of post media images. */
export function PostMediaList({
  items,
  className,
  linkToSource = true,
}: PostMediaListProps) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0];
    return (
      <PostMediaImage
        src={item.url}
        alt={item.altText ?? "Post media"}
        href={linkToSource ? item.url : undefined}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[12px] font-semibold text-[#64748b]">
          Carousel · {items.length} slides
        </p>
        <div className="flex gap-1">
          {items.map((_, index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-[#cbd5e1]"
              aria-hidden
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
        {items.map((item, index) => (
          <div
            key={item.id ?? `${item.url}-${index}`}
            className="w-[min(280px,78vw)] shrink-0 snap-start"
          >
            <div className="mb-1 text-[11px] font-medium text-[#94a3b8]">
              Slide {index + 1}
            </div>
            <PostMediaImage
              src={item.url}
              alt={item.altText ?? `Slide ${index + 1}`}
              href={linkToSource ? item.url : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use PostMediaList for multi-slide posts. */
export { PostMediaList as PostMediaCarousel };
