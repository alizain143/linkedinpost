"use client";

import { useState } from "react";
import { appLabel } from "@/components/app/app-ui";
import { Button, toggleVariant } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import {
  CONTENT_PILLAR_OPTIONS,
  CONTENT_PROFILE_OPTIONS,
  GOAL_OPTIONS,
  POST_TYPE_OPTIONS,
  TONE_OPTIONS,
} from "@/lib/form-options";
import { MOCK_GENERATED } from "@/lib/mock-app-data";
import { useAppUi } from "@/providers/app-ui-provider";

const GEN_MODES = [
  { id: "quick", label: "Quick Draft", icon: "bolt", desc: "1 credit · fast" },
  { id: "council", label: "AI Council", icon: "groups", desc: "3 credits · reviewed" },
  { id: "media", label: "Post + Media", icon: "auto_awesome_motion", desc: "10 credits · full" },
] as const;

export default function Generate() {
  const [mode, setMode] = useState("council");
  const [postType, setPostType] = useState("Personal story");
  const [tone, setTone] = useState("Bold & punchy");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { toastSave, showToast, openSchedule, requireLinkedIn } = useAppUi();

  const runGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1400);
  };

  const pillVariant = (active: boolean) => toggleVariant(active);

  return (
    <div className="pp-gen">
      <div className="sticky top-[90px] rounded-[18px] border border-[#eceef4] bg-white p-[22px]">
        <div className="mb-[18px] flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
            <MsIcon name="auto_awesome" size={21} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold">Post generator</h2>
            <p className="text-[12.5px] text-[#94a3b8]">
              Pick a mode, then generate a reviewed post.
            </p>
          </div>
        </div>

        <div className="mb-[18px] flex gap-2">
          {GEN_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex flex-1 flex-col items-start gap-0.5 rounded-[11px] border p-2.5 text-left ${
                mode === m.id
                  ? "border-[#4f46e5] bg-[#eef2ff]"
                  : "border-[#e3e6ef] bg-white hover:bg-[#f6f7fb]"
              }`}
            >
              <MsIcon
                name={m.icon}
                size={20}
                className={mode === m.id ? "text-[#4f46e5]" : "text-[#94a3b8]"}
              />
              <span
                className={`text-[12.5px] font-bold leading-tight ${
                  mode === m.id ? "text-[#4338ca]" : "text-[#1e293b]"
                }`}
              >
                {m.label}
              </span>
              <span className="text-[10.5px] leading-tight text-[#94a3b8]">{m.desc}</span>
            </button>
          ))}
        </div>

        <SelectField
          label="Content profile"
          fieldClassName="mb-4"
          options={CONTENT_PROFILE_OPTIONS}
          defaultValue="Maya — Startup Founder"
        />

        <label className={appLabel}>Post type</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {POST_TYPE_OPTIONS.map((pt) => (
            <Button
              key={pt}
              type="button"
              variant={pillVariant(postType === pt)}
              size="xs"
              onClick={() => setPostType(pt)}
            >
              {pt}
            </Button>
          ))}
        </div>

        <label className={appLabel}>Tone</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {TONE_OPTIONS.map((tn) => (
            <Button
              key={tn}
              type="button"
              variant={pillVariant(tone === tn)}
              size="xs"
              onClick={() => setTone(tn)}
            >
              {tn}
            </Button>
          ))}
        </div>

        <InputField
          label="Topic"
          fieldClassName="mb-4"
          defaultValue="A hard lesson from scaling my team"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <SelectField
            label="Content pillar"
            selectClassName="text-[13px]"
            options={CONTENT_PILLAR_OPTIONS}
            defaultValue="Founder lessons"
          />
          <SelectField
            label="Goal"
            selectClassName="text-[13px]"
            options={GOAL_OPTIONS}
            defaultValue="Build authority"
          />
        </div>

        <TextareaField
          label="Notes"
          hint="(optional)"
          fieldClassName="mb-4"
          className="h-16"
          placeholder="Drop a rough idea, a bullet, or paste a note to repurpose…"
        />

        <Button
          type="button"
          variant="gradient"
          size="lg"
          fullWidth
          onClick={runGenerate}
          disabled={generating}
        >
          <MsIcon name="auto_awesome" size={19} />
          Generate with AI Council
        </Button>
      </div>

      <div>
        {generating ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#4f46e5]">
              <MsIcon name="progress_activity" size={20} className="animate-ppspin" />
              Writing 3 posts in your voice…
            </div>
            {[1, 0.6].map((opacity, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#eceef4] bg-white p-[22px]"
                style={{ opacity }}
              >
                <div className="animate-ppshimmer mb-4 h-3.5 w-[60%] rounded-md" />
                <div className="animate-ppshimmer mb-2 h-2.5 w-full rounded-md" />
                <div className="animate-ppshimmer mb-2 h-2.5 w-[95%] rounded-md" />
                <div className="animate-ppshimmer h-2.5 w-[80%] rounded-md" />
              </div>
            ))}
          </div>
        ) : generated ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#16a34a]">
                <MsIcon name="check_circle" size={19} />
                3 posts ready
              </div>
              <Button
                type="button"
                variant="muted"
                size="xs"
                onClick={runGenerate}
              >
                <MsIcon name="refresh" size={16} />
                Regenerate
              </Button>
            </div>
            {MOCK_GENERATED.map((g, i) => (
              <div
                key={g.hook}
                className="animate-ppscale overflow-hidden rounded-2xl border border-[#eceef4] bg-white shadow-[0_1px_3px_rgba(24,28,64,0.05)]"
              >
                <div className="flex items-center justify-between border-b border-[#f1f3f8] bg-[#fbfbfd] px-[18px] py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
                    <MsIcon name="auto_awesome" size={13} />
                    AI DRAFT · OPTION {i + 1}
                  </span>
                  <span className="text-[11.5px] text-[#94a3b8]">{g.words} words</span>
                </div>
                <div className="p-[18px]">
                  <p className="mb-3 font-display text-[16.5px] font-bold leading-snug tracking-[-0.01em] text-[#0f172a]">
                    {g.hook}
                  </p>
                  <p className="mb-3.5 whitespace-pre-wrap text-sm leading-relaxed text-[#3f4a5e]">
                    {g.body}
                  </p>
                  <div className="mb-3.5 rounded-[11px] border-l-[3px] border-[#4f46e5] bg-[#f6f7fb] px-3.5 py-3">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#4f46e5]">
                      Call to action
                    </span>
                    <span className="text-[13.5px] font-medium leading-snug text-[#1e293b]">
                      {g.cta}
                    </span>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {g.tags.map((tag) => (
                      <span key={tag} className="text-[12.5px] font-semibold text-[#0891b2]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Save Draft", icon: "bookmark_add", color: "#7c3aed", action: toastSave },
                      { label: "Send to Review", icon: "rate_review", color: "#0891b2", action: () => showToast("Sent to approval queue", "fact_check") },
                      { label: "Generate Media", icon: "image", color: "#c026d3", action: () => showToast("Generating media…", "image") },
                    ].map((btn) => (
                      <Button
                        key={btn.label}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={btn.action}
                      >
                        <MsIcon name={btn.icon} size={16} style={{ color: btn.color }} />
                        {btn.label}
                      </Button>
                    ))}
                    <Button type="button" variant="success" size="sm" onClick={openSchedule}>
                      <MsIcon name="event_available" size={16} />
                      Approve & Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="linkedin"
                      size="sm"
                      onClick={requireLinkedIn(() => showToast("Publishing…", "send"))}
                    >
                      <MsIcon name="send" size={16} />
                      Approve & Post Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#d8dce8] bg-white px-8 py-14 text-center">
            <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#eef2ff] to-[#ecfeff]">
              <MsIcon name="auto_awesome" size={34} className="text-[#4f46e5]" />
            </div>
            <h3 className="mb-2 font-display text-[19px] font-bold">
              Your posts will appear here
            </h3>
            <p className="mb-[22px] max-w-[340px] text-[14.5px] leading-relaxed text-[#64748b]">
              Set your tone and topic on the left, then generate three polished,
              ready-to-post LinkedIn drafts.
            </p>
            <Button type="button" variant="primary" size="md" onClick={runGenerate}>
              <MsIcon name="auto_awesome" size={18} />
              Generate 3 Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
