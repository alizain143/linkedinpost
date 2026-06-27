"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/app/app-ui";
import { Button, toggleVariant } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import {
  AUTOPILOT_STRATEGY_FIELDS,
  TIMEZONE_OPTIONS,
} from "@/lib/form-options";
import {
  AUTOPILOT_ACTIVE_DAYS,
  AUTOPILOT_DAYS,
  AUTOPILOT_FREQ_OPTIONS,
  AUTOPILOT_PLANNED_POSTS,
  AUTOPILOT_POST_TYPE_MIX,
  AUTOPILOT_STATUS_ROWS,
} from "@/lib/mock-app-data";
import { useAppUi } from "@/providers/app-ui-provider";

export default function Autopilot() {
  const [active, setActive] = useState(true);
  const [freq, setFreq] = useState("3x / week");
  const { confirmPauseAutopilot, showToast } = useAppUi();

  const toggleAutopilot = () => {
    if (active) {
      confirmPauseAutopilot(() => setActive(false));
    } else {
      setActive(true);
      showToast("Autopilot turned on", "auto_mode");
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold">Autopilot</h2>
            <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
              PRO
            </span>
          </div>
          <p className="mt-1 text-[14px] text-[#64748b]">
            Automatically generates and queues posts from your content strategy.
          </p>
        </div>
        <Button
          variant={active ? "secondary" : "primary"}
          size="md"
          onClick={toggleAutopilot}
        >
          <MsIcon name={active ? "pause" : "play_arrow"} size={18} />
          {active ? "Pause Autopilot" : "Turn On Autopilot"}
        </Button>
      </div>

      <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-5 text-white">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/15">
              <MsIcon name="auto_mode" size={21} className="text-white" />
            </div>
            <span className="font-display text-[15px] font-bold">Status</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(94,234,212,0.14)] px-2.5 py-0.5 text-[11px] font-bold text-[#5eead4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
            {active ? "Active" : "Paused"}
          </span>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          {AUTOPILOT_STATUS_ROWS.map(({ label, value }) => (
            <div key={label}>
              <div className="text-[11px] text-white/60">{label}</div>
              <div className="font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pp-2col mb-5">
        <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
          <h3 className="mb-4 font-display text-[15px] font-bold">
            Posting frequency
          </h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {AUTOPILOT_FREQ_OPTIONS.map((f) => (
              <Button
                key={f}
                type="button"
                variant={toggleVariant(freq === f)}
                size="sm"
                onClick={() => setFreq(f)}
              >
                {f}
              </Button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {AUTOPILOT_DAYS.map((d) => (
              <Button
                key={d}
                type="button"
                variant={toggleVariant(AUTOPILOT_ACTIVE_DAYS.has(d))}
                size="day"
                onClick={() => {}}
              >
                {d}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Publish time"
              variant="app-sm"
              defaultValue="9:00 AM"
            />
            <SelectField
              label="Timezone"
              selectClassName="text-sm"
              options={TIMEZONE_OPTIONS}
              defaultValue="GMT-5 Eastern"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
          <h3 className="mb-4 font-display text-[15px] font-bold">
            Content strategy
          </h3>
          {AUTOPILOT_STRATEGY_FIELDS.map((field) => (
            <SelectField
              key={field.label}
              label={field.label}
              fieldClassName="mb-3"
              selectClassName="text-sm"
              options={field.options}
              defaultValue={field.default}
            />
          ))}
          <label className="mb-2 block text-[12.5px] font-semibold text-[#475569]">
            Post type mix
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AUTOPILOT_POST_TYPE_MIX.map((t, i) => (
              <span
                key={t}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  i < 3
                    ? "bg-[#eef2ff] text-[#4338ca]"
                    : "border border-[#e3e6ef] text-[#94a3b8]"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
        <h3 className="mb-4 font-display text-[15px] font-bold">
          Next planned posts
        </h3>
        <div className="space-y-2">
          {AUTOPILOT_PLANNED_POSTS.map((p) => (
            <Link
              key={p.day}
              href="/app/pipeline"
              className="flex items-center justify-between rounded-[11px] border border-[#eef0f5] px-4 py-3 hover:border-[#dfe3f0] hover:bg-[#fafbff]"
            >
              <div>
                <div className="text-xs font-bold text-[#94a3b8]">{p.day}</div>
                <div className="text-sm font-semibold text-[#1e293b]">{p.topic}</div>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
