import { LogoMark } from "@/components/ui/logo-mark";
import { MsIcon } from "@/components/ui/ms-icon";

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "auto_awesome", label: "Generate", active: false },
  { icon: "bolt", label: "Autopilot", active: false },
  { icon: "account_tree", label: "Pipeline", active: false },
  { icon: "calendar_month", label: "Calendar", active: false },
  { icon: "task_alt", label: "Approvals", active: false },
] as const;

export function HeroDashboardMockup() {
  return (
    <div className="pp-hero-mock">
      <div className="pointer-events-none absolute inset-x-[12%] top-[-6%] bottom-[40%] z-0 rounded-full bg-gradient-to-br from-indigo-500/18 to-cyan-500/16 blur-[60px]" />
      <div className="relative z-[1] w-full max-w-full overflow-hidden rounded-[18px] border border-[#e7e9f2] bg-white text-left shadow-[0_30px_70px_-28px_rgba(24,28,64,0.36),0_4px_14px_rgba(24,28,64,0.06)]">
        <div className="flex h-[534px]">
          {/* Sidebar */}
          <div className="flex w-[226px] shrink-0 flex-col gap-[3px] border-r border-[#eef0f5] bg-[#fbfbfd] px-3.5 py-4">
            <div className="flex items-center gap-[9px] px-2 pb-[13px] pt-[5px]">
              <LogoMark size={28} className="rounded-lg" />
              <span className="font-newsreader text-base font-semibold tracking-[-0.01em] text-[#1b1726]">
                linkedinpost<span className="text-[#5B3DF5]">.ai</span>
              </span>
            </div>

            <div className="mb-2 flex items-center justify-between rounded-[10px] border border-[#eceef4] bg-white px-[11px] py-[9px]">
              <div className="flex items-center gap-[9px]">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[#5B3DF5] font-display text-xs font-bold text-white">
                  M
                </div>
                <div>
                  <div className="font-display text-[12.5px] font-bold leading-[1.2] text-[#0f172a]">
                    Maya&apos;s Workspace
                  </div>
                  <div className="text-[10.5px] text-[#94a3b8]">Personal</div>
                </div>
              </div>
              <MsIcon name="unfold_more" size={17} className="text-[#b6bdcc]" />
            </div>

            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-[11px] rounded-[9px] px-[11px] py-2 text-[13px] ${
                  item.active
                    ? "bg-[#eef2ff] font-semibold text-[#4338ca]"
                    : "font-medium text-[#64748b]"
                }`}
              >
                <MsIcon name={item.icon} size={18} />
                {item.label}
              </div>
            ))}

            <div className="mt-auto rounded-xl border border-[#eceef4] bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b]">
                  Credits
                </span>
                <span className="font-display text-[11px] font-bold text-[#334155]">
                  23 / 50
                </span>
              </div>
              <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-[#eef0f5]">
                <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />
              </div>
              <div className="rounded-lg bg-[#4f46e5] py-[7px] text-center text-[11.5px] font-semibold text-white">
                Upgrade Plan
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f7f9]">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#eef0f5] bg-white px-5 py-3.5">
              <span className="shrink-0 font-display text-[17px] font-bold">Dashboard</span>
              <div className="flex min-w-0 shrink items-center gap-[9px]">
                <div className="hidden min-[1024px]:flex w-[200px] shrink-0 items-center gap-[7px] rounded-[9px] border border-[#eceef4] bg-[#f4f5f8] px-[11px] py-[7px] text-xs text-[#94a3b8]">
                  <MsIcon name="search" size={15} />
                  Search posts, drafts…
                </div>
                <div className="flex shrink-0 items-center gap-[5px] rounded-[9px] border border-[#e7e9f2] bg-white px-[11px] py-[7px] text-xs font-semibold text-[#0a66c2]">
                  <MsIcon name="link" size={14} />
                  <span className="hidden min-[900px]:inline">Connect</span>
                </div>
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#e7e9f2] bg-white text-[#64748b]">
                  <MsIcon name="notifications" size={18} />
                </div>
                <div className="flex items-center gap-[5px] rounded-[9px] bg-[#4f46e5] px-[13px] py-[7px] text-xs font-semibold text-white">
                  <MsIcon name="auto_awesome" size={14} />
                  Generate
                </div>
              </div>
            </div>

            <div className="overflow-hidden px-5 py-[18px]">
              <div className="mb-4 flex items-center gap-[13px] rounded-[13px] border border-[#dbe7fb] bg-gradient-to-br from-[#eef4ff] to-[#eaf6fb] px-[15px] py-[13px]">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[#0a66c2] font-display text-lg font-extrabold text-white">
                  in
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[13px] font-bold text-[#0f172a]">
                    Connect your LinkedIn account
                  </div>
                  <div className="text-[11.5px] leading-[1.4] text-[#5b6b86]">
                    Link your profile to schedule and publish posts straight from
                    linkedinpost.ai.
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-[5px] rounded-[9px] bg-[#0a66c2] px-[13px] py-2 text-[11.5px] font-semibold text-white">
                  <MsIcon name="link" size={14} />
                  <span className="hidden min-[900px]:inline">Connect LinkedIn</span>
                </div>
              </div>

              <div className="mb-1 font-display text-[23px] font-extrabold tracking-[-0.02em] text-[#0f172a]">
                Welcome back, Maya
              </div>
              <div className="mb-[15px] text-[13px] text-[#7886a0]">
                Create, review, approve, and publish LinkedIn content from one
                workflow.
              </div>

              <div className="mb-4 flex flex-wrap gap-[9px]">
                <div className="flex items-center gap-[7px] rounded-[10px] border border-[#e7e9f2] bg-white px-3.5 py-[9px] text-[12.5px] font-semibold text-[#334155]">
                  <MsIcon name="bolt" size={16} className="text-[#5B3DF5]" />
                  Turn On Autopilot
                </div>
                <div className="flex items-center gap-[7px] rounded-[10px] border border-[#e7e9f2] bg-white px-3.5 py-[9px] text-[12.5px] font-semibold text-[#334155]">
                  <MsIcon name="calendar_month" size={16} className="text-[#0a66c2]" />
                  Create Calendar
                </div>
                <div className="flex items-center gap-[7px] rounded-[10px] bg-[#4f46e5] px-3.5 py-[9px] text-[12.5px] font-semibold text-white">
                  <MsIcon name="auto_awesome" size={16} />
                  Generate One Post
                </div>
              </div>

              <div className="grid grid-cols-1 gap-[13px] min-[900px]:grid-cols-[1.15fr_1fr]">
                <div className="rounded-[14px] bg-gradient-to-br from-[#1e1b4b] to-[#312a6b] p-[17px] text-white">
                  <div className="mb-[15px] flex items-center justify-between">
                    <div className="flex items-center gap-[9px]">
                      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/12">
                        <MsIcon name="bolt" size={18} className="text-[#c9b8ff]" />
                      </div>
                      <span className="font-display text-[15px] font-bold">
                        Autopilot
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-[5px] rounded-full bg-emerald-400/18 px-[9px] py-[3px] text-[10.5px] font-bold text-[#6ee7b7]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-[26px]">
                    <div>
                      <div className="mb-0.5 text-[10.5px] text-white/55">
                        Frequency
                      </div>
                      <div className="font-display text-[13px] font-semibold">
                        5 posts / week
                      </div>
                    </div>
                    <div>
                      <div className="mb-0.5 text-[10.5px] text-white/55">
                        Next generation
                      </div>
                      <div className="font-display text-[13px] font-semibold">
                        Tomorrow 10:00 AM
                      </div>
                    </div>
                    <div>
                      <div className="mb-0.5 text-[10.5px] text-white/55">
                        Next publish
                      </div>
                      <div className="font-display text-[13px] font-semibold">
                        Fri 9:00 AM
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[14px] border border-[#eceef4] bg-white p-[17px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[9px]">
                      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#fff7ed]">
                        <MsIcon name="rate_review" size={18} className="text-[#ea9a3e]" />
                      </div>
                      <span className="font-display text-[15px] font-bold text-[#0f172a]">
                        Approval queue
                      </span>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-[#ea9a3e]">
                      3
                    </span>
                  </div>
                  <div className="mt-[18px] flex items-center justify-between">
                    <span className="text-xs text-[#64748b]">
                      3 posts ready for review
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4f46e5]">
                      Review now
                      <MsIcon name="arrow_forward" size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
