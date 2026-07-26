import Link from "next/link";
import { getAuthorById, type AuthorId } from "@/lib/authors";

type GuideBylineProps = {
  authorId: AuthorId;
  publishedAt: string;
  updatedAt: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function GuideByline({
  authorId,
  publishedAt,
  updatedAt,
}: GuideBylineProps) {
  const author = getAuthorById(authorId);
  const published = formatDate(publishedAt);
  const updated = formatDate(updatedAt);
  const showUpdated = updatedAt !== publishedAt;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[#eef0f5] py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] font-display text-xs font-bold text-[#4338ca]">
        LP
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[#0f172a]">
          <Link
            href={`/authors/${author.slug}`}
            className="hover:text-[#4338ca] hover:underline"
          >
            {author.name}
          </Link>
          <span className="font-normal text-[#64748b]"> · {author.jobTitle}</span>
        </p>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Published {published}
          {showUpdated ? ` · Updated ${updated}` : null}
        </p>
        <p className="mt-1 max-w-[52ch] text-[13px] leading-snug text-[#94a3b8]">
          {author.description}
        </p>
      </div>
    </div>
  );
}
