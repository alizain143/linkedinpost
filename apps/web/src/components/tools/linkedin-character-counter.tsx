"use client";

import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

/** Common "see more" cutoff for LinkedIn posts in-feed. */
export const SEE_MORE_CUTOFF = 1300;
/** Often cited practical ceiling for LinkedIn posts. */
export const PRACTICAL_MAX = 3000;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function estimateLines(text: string, charsPerLine = 60): number {
  if (!text) return 0;
  return text.split("\n").reduce((sum, line) => {
    if (line.length === 0) return sum + 1;
    return sum + Math.max(1, Math.ceil(line.length / charsPerLine));
  }, 0);
}

export function LinkedInCharacterCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const chars = [...text];
    const characters = chars.length;
    const words = countWords(text);
    const lines = estimateLines(text);
    const overSeeMore = characters > SEE_MORE_CUTOFF;
    const overPractical = characters > PRACTICAL_MAX;
    const progress = Math.min(100, (characters / SEE_MORE_CUTOFF) * 100);
    return {
      characters,
      words,
      lines,
      overSeeMore,
      overPractical,
      progress,
      preview: chars.slice(0, SEE_MORE_CUTOFF).join(""),
      remainder: overSeeMore ? chars.slice(SEE_MORE_CUTOFF).join("") : "",
    };
  }, [text]);

  async function handleCopy() {
    if (!text) {
      toast.error("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy. Try selecting the text manually.");
    }
  }

  function handleClear() {
    setText("");
  }

  return (
    <div className="rounded-[18px] border border-[#eceef4] bg-white p-5 shadow-[0_1px_2px_rgba(24,28,64,0.04)] sm:p-7">
      <Toaster position="bottom-center" richColors closeButton />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] font-extrabold tracking-tight text-[#0d1326]">
            Draft your post
          </h2>
          <p className="mt-1 text-[14px] text-[#64748b]">
            Counts update as you type. No signup required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={!text}
          >
            Clear
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleCopy}>
            <MsIcon name="content_copy" size={18} />
            Copy
          </Button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your LinkedIn post here..."
        rows={10}
        className="w-full resize-y rounded-[14px] border border-[#e3e6ef] bg-[#fafbff] px-4 py-3.5 text-[15px] leading-[1.55] text-[#0d1326] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f46e5] focus:bg-white"
        aria-label="LinkedIn post draft"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Characters"
          value={stats.characters}
          hint={
            stats.overPractical
              ? `Over ${PRACTICAL_MAX.toLocaleString()} practical max`
              : stats.overSeeMore
                ? `Past ${SEE_MORE_CUTOFF.toLocaleString()} see more`
                : `of ~${SEE_MORE_CUTOFF.toLocaleString()} see more`
          }
          warn={stats.overSeeMore}
          danger={stats.overPractical}
        />
        <StatCard label="Words" value={stats.words} hint="Space-separated" />
        <StatCard
          label="Est. lines"
          value={stats.lines}
          hint="~60 chars per line"
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
          <span className="font-semibold text-[#475569]">
            See more marker ({SEE_MORE_CUTOFF.toLocaleString()} chars)
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              stats.overPractical
                ? "text-[#dc2626]"
                : stats.overSeeMore
                  ? "text-[#d97706]"
                  : "text-[#4f46e5]",
            )}
          >
            {stats.characters.toLocaleString()} / {SEE_MORE_CUTOFF.toLocaleString()}
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-[#eef0f5]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              stats.overPractical
                ? "bg-[#dc2626]"
                : stats.overSeeMore
                  ? "bg-[#f59e0b]"
                  : "bg-[#4f46e5]",
            )}
            style={{ width: `${stats.progress}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-[#0d1326]/70"
            style={{ left: "100%" }}
            aria-hidden
          />
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
          Feed preview historically truncated around ~140 characters on some
          surfaces. The in-post &quot;see more&quot; expand is commonly around{" "}
          {SEE_MORE_CUTOFF.toLocaleString()} characters. Many creators treat{" "}
          {PRACTICAL_MAX.toLocaleString()} as a practical upper bound for posts.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PreviewPanel
          title="In-feed before see more"
          badge={stats.overSeeMore ? "Truncated" : "Full visible"}
          badgeTone={stats.overSeeMore ? "warn" : "ok"}
        >
          <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-[#0d1326]">
            {stats.preview || (
              <span className="text-[#94a3b8]">Your preview will appear here.</span>
            )}
            {stats.overSeeMore ? (
              <span className="font-semibold text-[#4f46e5]"> …see more</span>
            ) : null}
          </p>
        </PreviewPanel>
        <PreviewPanel title="Full post" badge="Complete" badgeTone="muted">
          <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-[#0d1326]">
            {text || (
              <span className="text-[#94a3b8]">Your full draft will appear here.</span>
            )}
          </p>
        </PreviewPanel>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  warn,
  danger,
}: {
  label: string;
  value: number;
  hint: string;
  warn?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-[#eceef4] bg-[#fafbff] px-4 py-3.5">
      <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-[28px] font-extrabold tabular-nums tracking-tight",
          danger ? "text-[#dc2626]" : warn ? "text-[#d97706]" : "text-[#0d1326]",
        )}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[12.5px] text-[#94a3b8]">{hint}</div>
    </div>
  );
}

function PreviewPanel({
  title,
  badge,
  badgeTone,
  children,
}: {
  title: string;
  badge: string;
  badgeTone: "ok" | "warn" | "muted";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[#eceef4] bg-[#f8f9fc] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-[15px] font-bold text-[#0d1326]">
          {title}
        </h3>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]",
            badgeTone === "ok" && "bg-[#ecfdf5] text-[#059669]",
            badgeTone === "warn" && "bg-[#fffbeb] text-[#d97706]",
            badgeTone === "muted" && "bg-[#eef0f5] text-[#64748b]",
          )}
        >
          {badge}
        </span>
      </div>
      <div className="max-h-[220px] overflow-y-auto rounded-[10px] border border-[#eceef4] bg-white p-3.5">
        {children}
      </div>
    </div>
  );
}
