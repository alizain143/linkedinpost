"use client";

import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

type FormatMode = "plain" | "bold" | "italic" | "bullets";

const BOLD_OFFSET_UPPER = 0x1d400 - "A".charCodeAt(0);
const BOLD_OFFSET_LOWER = 0x1d41a - "a".charCodeAt(0);
const BOLD_OFFSET_DIGIT = 0x1d7ce - "0".charCodeAt(0);
const ITALIC_OFFSET_UPPER = 0x1d434 - "A".charCodeAt(0);
const ITALIC_OFFSET_LOWER = 0x1d44e - "a".charCodeAt(0);

function toBoldChar(ch: string): string {
  if (ch >= "A" && ch <= "Z") {
    return String.fromCodePoint(ch.charCodeAt(0) + BOLD_OFFSET_UPPER);
  }
  if (ch >= "a" && ch <= "z") {
    return String.fromCodePoint(ch.charCodeAt(0) + BOLD_OFFSET_LOWER);
  }
  if (ch >= "0" && ch <= "9") {
    return String.fromCodePoint(ch.charCodeAt(0) + BOLD_OFFSET_DIGIT);
  }
  return ch;
}

function toItalicChar(ch: string): string {
  if (ch >= "A" && ch <= "Z") {
    return String.fromCodePoint(ch.charCodeAt(0) + ITALIC_OFFSET_UPPER);
  }
  if (ch === "h") {
    // Mathematical italic h uses the Planck constant code point.
    return "\u210e";
  }
  if (ch >= "a" && ch <= "z") {
    return String.fromCodePoint(ch.charCodeAt(0) + ITALIC_OFFSET_LOWER);
  }
  return ch;
}

function mapText(text: string, mapper: (ch: string) => string): string {
  return [...text].map(mapper).join("");
}

function applyBullets(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trimStart();
      if (!trimmed) return line;
      if (/^[•●▪◦\-\u2013\u2014]\s/.test(trimmed)) {
        return line.replace(/^(\s*)[•●▪◦\-\u2013\u2014]\s*/, "$1• ");
      }
      const leading = line.match(/^\s*/)?.[0] ?? "";
      return `${leading}• ${trimmed}`;
    })
    .join("\n");
}

function formatText(text: string, mode: FormatMode): string {
  if (!text) return "";
  switch (mode) {
    case "bold":
      return mapText(text, toBoldChar);
    case "italic":
      return mapText(text, toItalicChar);
    case "bullets":
      return applyBullets(text);
    default:
      return text;
  }
}

const MODES: { id: FormatMode; label: string; icon: string }[] = [
  { id: "plain", label: "Plain", icon: "draft" },
  { id: "bold", label: "Bold", icon: "auto_awesome" },
  { id: "italic", label: "Italic", icon: "edit" },
  { id: "bullets", label: "Bullets", icon: "view_list" },
];
export function LinkedInTextFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<FormatMode>("bold");

  const output = useMemo(() => formatText(input, mode), [input, mode]);

  async function handleCopy() {
    if (!output) {
      toast.error("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Formatted text copied");
    } catch {
      toast.error("Could not copy. Try selecting the text manually.");
    }
  }

  function handleClear() {
    setInput("");
  }

  return (
    <div className="rounded-[18px] border border-[#eceef4] bg-white p-5 shadow-[0_1px_2px_rgba(24,28,64,0.04)] sm:p-7">
      <Toaster position="bottom-center" richColors closeButton />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] font-extrabold tracking-tight text-[#0d1326]">
            Format LinkedIn text
          </h2>
          <p className="mt-1 text-[14px] text-[#64748b]">
            Unicode bold, italic, and bullets. Runs in your browser only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={!input}
          >
            Clear
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleCopy}>
            <MsIcon name="content_copy" size={18} />
            Copy output
          </Button>
        </div>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Formatting style"
      >
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
              mode === item.id
                ? "border-[#4f46e5] bg-[#eef2ff] text-[#4338ca]"
                : "border-[#e3e6ef] bg-white text-[#475569] hover:bg-[#f6f7fb]",
            )}
            aria-pressed={mode === item.id}
          >
            <MsIcon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label
            htmlFor="linkedin-formatter-input"
            className="mb-2 block text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]"
          >
            Input
          </label>
          <textarea
            id="linkedin-formatter-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type the text you want to style..."
            rows={10}
            className="w-full resize-y rounded-[14px] border border-[#e3e6ef] bg-[#fafbff] px-4 py-3.5 text-[15px] leading-[1.55] text-[#0d1326] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f46e5] focus:bg-white"
          />
        </div>
        <div>
          <label
            htmlFor="linkedin-formatter-output"
            className="mb-2 block text-[12px] font-bold uppercase tracking-[0.05em] text-[#64748b]"
          >
            Output
          </label>
          <textarea
            id="linkedin-formatter-output"
            value={output}
            readOnly
            rows={10}
            placeholder="Styled text appears here..."
            className="w-full resize-y rounded-[14px] border border-[#e3e6ef] bg-[#f8f9fc] px-4 py-3.5 text-[15px] leading-[1.55] text-[#0d1326] outline-none placeholder:text-[#94a3b8]"
          />
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[#64748b]">
        LinkedIn accepts Unicode styled characters in posts. Letters and digits
        map to mathematical bold or italic code points. Unsupported characters
        stay as-is. This is not rich-text formatting, so paste into LinkedIn
        and double-check how it looks before publishing.
      </p>
    </div>
  );
}
