"use client";

import { MsIcon } from "@/components/ui/ms-icon";
import type { GenerationHistoryEntry } from "@/lib/generation-session";
import { formatRelativeTime } from "@/lib/format-relative-time";

const KIND_LABELS: Record<GenerationHistoryEntry["kind"], string> = {
  quick_draft: "Quick draft",
  council: "AI Council",
  calendar: "Calendar",
};

const KIND_ICONS: Record<GenerationHistoryEntry["kind"], string> = {
  quick_draft: "bolt",
  council: "groups",
  calendar: "calendar_month",
};

type GenerationHistoryPanelProps = {
  history: GenerationHistoryEntry[];
  onRestore: (entry: GenerationHistoryEntry) => void;
  emptyMessage?: string;
};

export function GenerationHistoryPanel({
  history,
  onRestore,
  emptyMessage = "Your recent generations will appear here.",
}: GenerationHistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="mt-5 border-t border-[#eceef4] pt-5">
        <h3 className="mb-2 font-display text-[13px] font-bold text-[#1e293b]">
          Generation history
        </h3>
        <p className="text-[12px] leading-relaxed text-[#94a3b8]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-[#eceef4] pt-5">
      <h3 className="mb-3 font-display text-[13px] font-bold text-[#1e293b]">
        Generation history
      </h3>
      <div className="max-h-56 overflow-y-auto rounded-[11px] border border-[#eceef4]">
        <table className="w-full table-fixed text-left text-[12px]">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[34%]" />
            <col className="w-[22%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="sticky top-0 bg-[#f8f9fc] text-[10.5px] font-bold uppercase tracking-wide text-[#94a3b8]">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Topic</th>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f8] bg-white">
            {history.map((entry) => {
              const typeLabel = KIND_LABELS[entry.kind];
              const topicLabel = entry.topic || entry.label;

              return (
                <tr key={entry.id} className="group hover:bg-[#f8f9fc]">
                  <td className="overflow-hidden px-3 py-2.5">
                    <span
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#f1f3f8] px-2 py-0.5 text-[10.5px] font-semibold text-[#475569]"
                      title={typeLabel}
                    >
                      <MsIcon
                        name={KIND_ICONS[entry.kind]}
                        size={12}
                        className="shrink-0"
                      />
                      <span className="min-w-0 truncate">{typeLabel}</span>
                    </span>
                  </td>
                  <td className="overflow-hidden px-3 py-2.5">
                    <span
                      className="block truncate font-medium text-[#1e293b]"
                      title={topicLabel}
                    >
                      {topicLabel}
                    </span>
                  </td>
                  <td className="overflow-hidden px-3 py-2.5">
                    <span
                      className="block truncate text-[#94a3b8]"
                      title={formatRelativeTime(entry.createdAt)}
                    >
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRestore(entry)}
                      className="text-[11px] font-semibold text-[#4f46e5] opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
