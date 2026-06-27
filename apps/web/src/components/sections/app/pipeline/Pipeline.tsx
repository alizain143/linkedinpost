"use client";

import { StatusBadge } from "@/components/app/app-ui";
import { MsIcon } from "@/components/ui/ms-icon";
import { MOCK_PIPELINE, PIPELINE_STAGES } from "@/lib/mock-app-data";

export default function Pipeline() {
  return (
    <div>
      <p className="mb-5 text-[14px] text-[#64748b]">
        Track every post from brief to published across your content pipeline.
      </p>

      <div className="pp-kanban mb-6">
        {PIPELINE_STAGES.map((stage) => {
          const items = MOCK_PIPELINE.filter((p) => p.stage === stage);
          return (
            <div
              key={stage}
              className="w-[268px] shrink-0 rounded-2xl border border-[#eceef4] bg-[#f8f9fc]"
            >
              <div className="flex items-center justify-between border-b border-[#eceef4] px-3.5 py-3">
                <StatusBadge status={stage} />
                <span className="text-xs font-semibold text-[#94a3b8]">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2 p-2">
                {items.map((item) => (
                  <div
                    key={item.title}
                    className="cursor-pointer rounded-xl border border-[#eceef4] bg-white p-3 hover:border-[#dfe3f0]"
                  >
                    <span className="mb-2 inline-flex rounded-full bg-[#f1f3f8] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">
                      {item.src}
                    </span>
                    <div className="text-[13px] font-semibold leading-snug text-[#1e293b]">
                      {item.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10.5px] text-[#94a3b8]">
                      <span>{item.client}</span>
                      <span>·</span>
                      <span>{item.type}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10.5px] text-[#94a3b8]">
                        {item.media} · {item.date}
                      </span>
                      {item.score ? (
                        <span className="rounded-full bg-[#eef2ff] px-1.5 py-0.5 text-[10px] font-bold text-[#4f46e5]">
                          {item.score}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#cbd2e0]">Empty</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
        <div className="border-b border-[#f1f3f8] px-5 py-3.5 font-display text-sm font-bold">
          All pipeline items
        </div>
        <div className="divide-y divide-[#f1f3f8]">
          {MOCK_PIPELINE.map((item) => (
            <div
              key={item.title}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm"
            >
              <div className="min-w-0 flex-1 font-medium text-[#1e293b]">
                {item.title}
              </div>
              <span className="text-xs text-[#94a3b8]">{item.client}</span>
              <StatusBadge status={item.stage} />
              <span className="text-xs text-[#94a3b8]">{item.src}</span>
              {item.score ? (
                <span className="font-display text-xs font-bold text-[#4f46e5]">
                  {item.score}/100
                </span>
              ) : (
                <MsIcon name="hourglass_empty" size={16} className="text-[#cbd2e0]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
