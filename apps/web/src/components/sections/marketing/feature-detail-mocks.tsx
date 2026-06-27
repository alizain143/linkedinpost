import { MsIcon } from "@/components/ui/ms-icon";

export function FeatureGeneratorMock() {
  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-[#eceef4] bg-white shadow-[0_12px_34px_-16px_rgba(30,27,75,0.4)]">
      <div className="flex items-center justify-between border-b border-[#f1f2f6] px-3.5 py-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#5B3DF5]">
            <MsIcon name="auto_awesome" size={14} className="text-white" />
          </div>
          <span className="font-display text-[12.5px] font-bold">Generated draft</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold text-[#059669]">
          <span className="h-[5px] w-[5px] rounded-full bg-[#10b981]" />
          96% voice match
        </span>
      </div>
      <div className="flex gap-1.5 px-3.5 pb-1 pt-2.5">
        <span className="rounded-[7px] bg-[#eef2ff] px-2.5 py-1 text-[10.5px] font-bold text-[#4338ca]">
          Option A
        </span>
        <span className="rounded-[7px] bg-[#f4f5f8] px-2.5 py-1 text-[10.5px] font-semibold text-[#94a3b8]">
          B
        </span>
        <span className="rounded-[7px] bg-[#f4f5f8] px-2.5 py-1 text-[10.5px] font-semibold text-[#94a3b8]">
          C
        </span>
      </div>
      <div className="px-3.5 pb-3.5 pt-2">
        <div className="mb-1.5 font-display text-[13.5px] font-bold leading-snug text-[#0f172a]">
          I almost shut down my startup last year.
        </div>
        <div className="mb-1.5 h-2 rounded-full bg-[#f1f2f6]" />
        <div className="mb-1.5 h-2 w-[92%] rounded-full bg-[#f1f2f6]" />
        <div className="mb-3 h-2 w-[78%] rounded-full bg-[#f1f2f6]" />
        <div className="flex flex-wrap gap-1">
          {["#startups", "#founders", "#lessons"].map((tag) => (
            <span key={tag} className="text-[10.5px] font-semibold text-[#4f46e5]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureCalendarMock() {
  const cells = [
    "bg-[#f7f8fb]",
    "bg-[#eef2ff] border border-[#dbe2ff]",
    "bg-[#f7f8fb]",
    "bg-[#ecfeff] border border-[#c5f0f7]",
    "bg-[#f7f8fb]",
    "bg-[#f7f8fb]",
    "bg-[#f7f8fb]",
    "bg-[#f5f0ff] border border-[#e6d9ff]",
    "bg-[#f7f8fb]",
    "bg-[#eef2ff] border border-[#dbe2ff]",
    "bg-[#f7f8fb]",
    "bg-[#f7f8fb]",
    "bg-[#ecfeff] border border-[#c5f0f7]",
    "bg-[#f7f8fb]",
    "bg-[#f7f8fb]",
    "bg-[#f0fdf4] border border-[#cdeed7]",
    "bg-[#f7f8fb]",
    "bg-[#eef2ff] border border-[#dbe2ff]",
    "bg-[#f7f8fb]",
    "bg-[#f7f8fb]",
    "bg-[#f7f8fb]",
  ];

  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-[#eceef4] bg-white shadow-[0_12px_34px_-16px_rgba(8,145,178,0.4)]">
      <div className="flex items-center justify-between border-b border-[#f1f2f6] px-3.5 py-[11px]">
        <span className="font-display text-[13px] font-bold">June</span>
        <div className="flex gap-1">
          {["chevron_left", "chevron_right"].map((icon) => (
            <span
              key={icon}
              className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-[#f4f5f8]"
            >
              <MsIcon name={icon} size={13} className="text-[#94a3b8]" />
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 px-3.5 py-3">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-center text-[8.5px] font-bold text-[#b6bdcc]"
          >
            {d}
          </span>
        ))}
        {cells.map((cls, i) => (
          <div key={i} className={`aspect-square rounded-[5px] ${cls}`} />
        ))}
      </div>
    </div>
  );
}

export function FeatureProfileMock() {
  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-[#eceef4] bg-white shadow-[0_12px_34px_-16px_rgba(124,58,237,0.4)]">
      <div className="flex items-center gap-1.5 border-b border-[#f1f2f6] px-3.5 py-[11px]">
        <MsIcon name="tune" size={16} className="text-[#7c3aed]" />
        <span className="font-display text-[12.5px] font-bold">Content profile</span>
      </div>
      <div className="px-3.5 py-3">
        <div className="mb-1.5 text-[9.5px] font-bold tracking-wide text-[#94a3b8]">
          TONE
        </div>
        <div className="mb-3.5 flex flex-wrap gap-1">
          {[
            { label: "Bold", active: true },
            { label: "Thoughtful", active: true },
            { label: "Witty", active: false },
            { label: "Formal", active: false },
          ].map((t) => (
            <span
              key={t.label}
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                t.active
                  ? "bg-[#f5f0ff] font-bold text-[#7c3aed]"
                  : "bg-[#f4f5f8] text-[#94a3b8]"
              }`}
            >
              {t.label}
            </span>
          ))}
        </div>
        <div className="mb-1.5 text-[9.5px] font-bold tracking-wide text-[#94a3b8]">
          FORMALITY
        </div>
        <div className="relative mb-4 h-1.5 rounded-full bg-[#f1f2f6]">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#a855f7] to-[#7c3aed]" />
          <div className="absolute left-[62%] top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7c3aed] bg-white" />
        </div>
        <div className="mb-1.5 text-[9.5px] font-bold tracking-wide text-[#94a3b8]">
          WORDS TO AVOID
        </div>
        <div className="flex flex-wrap gap-1">
          {["delve", "leverage", "unlock", "game-changer"].map((w) => (
            <span
              key={w}
              className="rounded-md bg-[#fef2f2] px-2 py-0.5 text-[10px] font-semibold text-[#dc2626]"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureAgencyMock() {
  const clients = [
    {
      initials: "NB",
      name: "Northbeam",
      meta: "12 scheduled · 3 drafts",
      status: "Active",
      statusColor: "text-[#16a34a]",
      bg: "bg-[#f0fdf4] border-[#d8f0df]",
      avatar: "bg-[#16a34a]",
    },
    {
      initials: "LC",
      name: "Loft & Co",
      meta: "8 scheduled · 1 draft",
      status: "Idle",
      statusColor: "text-[#94a3b8]",
      bg: "bg-[#fafbfc] border-[#eef0f5]",
      avatar: "bg-[#4f46e5]",
    },
    {
      initials: "BP",
      name: "Brightpath",
      meta: "5 scheduled · 6 drafts",
      status: "Idle",
      statusColor: "text-[#94a3b8]",
      bg: "bg-[#fafbfc] border-[#eef0f5]",
      avatar: "bg-[#0891b2]",
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-[#eceef4] bg-white shadow-[0_12px_34px_-16px_rgba(22,163,74,0.4)]">
      <div className="flex items-center justify-between border-b border-[#f1f2f6] px-3.5 py-[11px]">
        <div className="flex items-center gap-1.5">
          <MsIcon name="groups" size={16} className="text-[#16a34a]" />
          <span className="font-display text-[12.5px] font-bold">Client workspaces</span>
        </div>
        <span className="text-[10px] font-bold text-[#16a34a]">4 / 5</span>
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {clients.map((c) => (
          <div
            key={c.name}
            className={`flex items-center gap-2 rounded-[9px] border p-2 ${c.bg}`}
          >
            <div
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-[7px] font-display text-[11px] font-bold text-white ${c.avatar}`}
            >
              {c.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[11.5px] font-bold leading-tight">
                {c.name}
              </div>
              <div className="text-[9.5px] text-[#94a3b8]">{c.meta}</div>
            </div>
            <span className={`text-[9.5px] font-semibold ${c.statusColor}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURE_MOCKS = [
  FeatureGeneratorMock,
  FeatureCalendarMock,
  FeatureProfileMock,
  FeatureAgencyMock,
] as const;

export function FeatureDetailMock({ index }: { index: number }) {
  const Mock = FEATURE_MOCKS[index] ?? FeatureGeneratorMock;
  return <Mock />;
}
