"use client";

import { appLabel } from "@/components/app/app-ui";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { useAppUi } from "@/providers/app-ui-provider";

const PILLARS = ["Founder lessons", "Industry takes", "How-to"];

const PROFILE_FIELDS = [
  ["Profile name", "Maya — Startup Founder"],
  ["Role", "Co-founder & CEO, Northbeam"],
  ["Industry", "B2B SaaS"],
  ["Audience", "Early-stage founders & operators"],
  ["Goal", "Build authority and drive inbound leads"],
  ["Tone", "Bold, practical, founder-to-founder"],
  ["Offer", "AI content engine for LinkedIn creators"],
] as const;

export default function Profile() {
  const { toastSaved } = useAppUi();

  return (
    <div className="pp-gen" style={{ gridTemplateColumns: "1fr 372px" }}>
      <div className="space-y-4">
        <div className="rounded-[18px] border border-[#eceef4] bg-white p-6">
          <h2 className="font-display text-lg font-bold">Content profile</h2>
          <p className="mt-1 text-[13px] text-[#94a3b8]">
            Your voice, audience, and strategy — used by every AI agent.
          </p>
          <div className="mt-5 space-y-4">
            {PROFILE_FIELDS.map(([label, value]) => (
              <InputField key={label} label={label} defaultValue={value} />
            ))}

            <div>
              <label className={appLabel}>Content pillars</label>
              <div className="flex flex-wrap gap-2">
                {PILLARS.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#4338ca]"
                  >
                    {p}
                  </span>
                ))}
                <Button type="button" variant="outline" size="xs" shape="pill" className="border-dashed">
                  + Add
                </Button>
              </div>
            </div>

            <TextareaField
              label="Writing sample"
              className="h-24"
              defaultValue="I almost shut down my startup last year. Revenue had flatlined for six months…"
            />

            <InputField
              label="Words to avoid"
              defaultValue="leverage, synergy, in today's fast-paced world, game-changer"
            />
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="button" variant="primary" size="md" onClick={toastSaved}>
              Save profile
            </Button>
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[18px] border border-[#eceef4] bg-white p-6">
          <h3 className="font-display text-base font-bold">Voice preview</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
            Based on your profile, posts will sound bold, practical, and
            founder-to-founder — never generic AI.
          </p>
          <div className="mt-4 rounded-xl border border-[#eef0f5] bg-[#fafbff] p-4">
            <p className="text-[13px] leading-relaxed text-[#3f4a5e]">
              &ldquo;I almost shut down my startup last year. Revenue had flatlined
              for six months…&rdquo;
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-[#16a34a]">
            <MsIcon name="check_circle" size={16} className="text-[#16a34a]" />
            94% voice match
          </div>
        </div>
      </div>
    </div>
  );
}
