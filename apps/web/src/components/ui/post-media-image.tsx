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
};

type PostMediaListProps = {
  items: PostMediaItem[];
  className?: string;
  /** Open each asset in a new tab (default true). */
  linkToSource?: boolean;
};

/** Stack of post media images, each shown at LinkedIn feed proportions. */
export function PostMediaList({
  items,
  className,
  linkToSource = true,
}: PostMediaListProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <PostMediaImage
          key={item.id ?? `${item.url}-${index}`}
          src={item.url}
          alt={item.altText ?? "Post media"}
          href={linkToSource ? item.url : undefined}
        />
      ))}
    </div>
  );
}
