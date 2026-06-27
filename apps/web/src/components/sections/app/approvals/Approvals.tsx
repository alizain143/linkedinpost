"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/app/app-ui";
import { Button, filterVariant } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { MOCK_APPROVALS } from "@/lib/mock-app-data";
import { useAppUi } from "@/providers/app-ui-provider";

const TABS = [
  { label: "My Approvals", count: 2 },
  { label: "Client Approvals", count: 2 },
  { label: "Changes Requested", count: 1 },
  { label: "Approved", count: 4 },
] as const;

export default function Approvals() {
  const [activeTab, setActiveTab] = useState(0);
  const { openSchedule, openRequestChanges, confirmRejectPost, showToast } =
    useAppUi();

  return (
    <div>
      <p className="mb-5 text-[14px] leading-relaxed text-[#64748b]">
        Review posts before they go live. Approve, request changes, or reject
        from one queue.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab, i) => (
          <Button
            key={tab.label}
            type="button"
            variant={filterVariant(activeTab === i)}
            shape="pill"
            size="tab"
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                activeTab === i ? "bg-white/20" : "bg-[#eef2ff] text-[#4f46e5]"
              }`}
            >
              {tab.count}
            </span>
          </Button>
        ))}
      </div>

      <div className="pp-2col">
        {MOCK_APPROVALS.map((a) => (
          <div
            key={a.title}
            className="rounded-2xl border border-[#eceef4] bg-white p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-bold leading-snug text-[#1e293b]">
                  {a.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#64748b]">
                  {a.preview}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-display text-xs font-bold ${
                  a.score >= 85
                    ? "bg-[#f0fdf4] text-[#16a34a]"
                    : "bg-[#fff8eb] text-[#d97706]"
                }`}
              >
                {a.score}/100
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-3 text-[11.5px] text-[#94a3b8]">
              <span>{a.client}</span>
              <span>·</span>
              <span>{a.created}</span>
              <span>·</span>
              <span>Schedule: {a.schedule}</span>
              {a.media ? (
                <span className="inline-flex items-center gap-1 text-[#7c3aed]">
                  <MsIcon name="image" size={14} />
                  Media attached
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" size="sm" onClick={openSchedule}>
                <MsIcon name="fact_check" size={16} />
                Review
              </Button>
              <Button type="button" variant="success" size="sm" onClick={openSchedule}>
                Approve
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={openRequestChanges}>
                Changes
              </Button>
              <Button
                type="button"
                variant="destructive-outline"
                size="sm"
                onClick={confirmRejectPost}
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => showToast("Approval link copied", "link")}
              >
                <MsIcon name="link" size={16} />
                Copy link
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
