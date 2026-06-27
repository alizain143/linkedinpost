"use client";

import { PlanCard } from "@/components/sections/marketing/shared";
import { MsIcon } from "@/components/ui/ms-icon";
import { PLANS } from "@/lib/marketing-data";
import {
  BILLING_HISTORY,
  BILLING_SUMMARY_CARDS,
  CREDIT_COSTS,
  USAGE_BREAKDOWN_ROWS,
  USAGE_BREAKDOWN_SEGMENTS,
} from "@/lib/mock-app-data";
import { useAppUi } from "@/providers/app-ui-provider";

export default function Billing() {
  const { confirmCancelPlan, showToast } = useAppUi();

  return (
    <div className="space-y-5">
      <div className="pp-grid3">
        {BILLING_SUMMARY_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#eceef4] bg-white p-5"
          >
            <div className="text-[12.5px] font-medium text-[#7886a0]">{card.label}</div>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">
              {card.value}
            </div>
            <div className="mt-1 text-xs text-[#94a3b8]">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#64748b]">Credit usage</span>
          <span className="font-display text-sm font-bold">23 / 200</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#f1f3f8]">
          <div className="h-full w-[11.5%] rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-display text-lg font-bold">Plans</h3>
        <div className="pp-grid4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>

      <div className="pp-2col-wide">
        <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
          <h3 className="mb-4 font-display font-bold">How credits work</h3>
          <div className="space-y-2 text-sm">
            {CREDIT_COSTS.map(({ action, cost }) => (
              <div
                key={action}
                className="flex justify-between border-b border-[#f1f3f8] py-2 last:border-0"
              >
                <span className="text-[#64748b]">{action}</span>
                <span className="font-semibold">{cost}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
          <h3 className="mb-4 font-display font-bold">Usage breakdown</h3>
          <div className="mb-3 flex h-3 overflow-hidden rounded-full">
            {USAGE_BREAKDOWN_SEGMENTS.map((seg, i) => (
              <div key={i} style={{ width: seg.w, background: seg.color }} />
            ))}
          </div>
          <div className="space-y-1.5 text-xs text-[#64748b]">
            {USAGE_BREAKDOWN_ROWS.map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display font-bold">Billing history</h3>
          <button
            type="button"
            onClick={confirmCancelPlan}
            className="text-xs font-semibold text-[#94a3b8] underline hover:text-[#64748b]"
          >
            Cancel subscription
          </button>
        </div>
        <div className="divide-y divide-[#f1f3f8]">
          {BILLING_HISTORY.map((row) => (
            <div
              key={row.date}
              className="flex items-center justify-between py-3.5 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f3f8]">
                  <MsIcon name="receipt" size={18} className="text-[#94a3b8]" />
                </div>
                <div>
                  <div className="font-semibold">{row.plan}</div>
                  <div className="text-xs text-[#94a3b8]">{row.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{row.amount}</span>
                <span className="inline-flex items-center gap-1 text-[#16a34a]">
                  <MsIcon name="check_circle" size={16} />
                  Paid
                </span>
                <button
                  type="button"
                  onClick={() => showToast("Downloading receipt…", "download")}
                  className="text-[#94a3b8] hover:text-[#64748b]"
                >
                  <MsIcon name="download" size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
