"use client";

import { MsIcon } from "@/components/ui/ms-icon";
import { Button } from "@/components/ui/button";
import { MOCK_CLIENTS } from "@/lib/mock-app-data";
import { useAppUi } from "@/providers/app-ui-provider";

function profileStyle(status: string) {
  if (status === "Complete") return "bg-[#f0fdf4] text-[#16a34a]";
  if (status === "In progress") return "bg-[#fff8eb] text-[#d97706]";
  return "bg-[#f1f3f8] text-[#64748b]";
}

export default function Clients() {
  const { confirmRemoveClient, showToast } = useAppUi();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#64748b]">
          <span className="font-semibold text-[#1e293b]">5 client workspaces</span>
          {" · "}Agency plan
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="rounded-[10px]"
          onClick={() => showToast("Client invite sent", "person_add")}
        >
          <MsIcon name="add" size={17} />
          Add client
        </Button>
      </div>

      <div className="pp-grid3">
        {MOCK_CLIENTS.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-[#eceef4] bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color} font-display text-sm font-bold text-white`}
              >
                {c.initials}
              </div>
              <div>
                <div className="font-display font-bold">{c.name}</div>
                <div className="text-xs text-[#94a3b8]">{c.industry}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#64748b]">{c.audience}</p>
            <div className="mt-4 flex gap-5 text-xs">
              <div>
                <div className="font-bold text-[#1e293b]">{c.drafts}</div>
                <div className="text-[#94a3b8]">Drafts</div>
              </div>
              <div>
                <div className="font-bold text-[#1e293b]">{c.scheduled}</div>
                <div className="text-[#94a3b8]">Scheduled</div>
              </div>
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${profileStyle(c.profile)}`}
                >
                  {c.profile}
                </span>
                <div className="mt-0.5 text-[#94a3b8]">Profile</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => showToast(`Opened ${c.name}`, "open_in_new")}
              >
                Open
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-3 hover:bg-[#fef2f2] hover:text-[#dc2626]"
                onClick={() => confirmRemoveClient(c.name)}
              >
                <MsIcon name="delete" size={18} />
              </Button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => showToast("Add client flow coming soon", "add")}
          className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8dce8] bg-white p-5 text-[#94a3b8] hover:border-[#cbd2e0] hover:bg-[#fafbff]"
        >
          <MsIcon name="add" size={28} className="mb-2" />
          <span className="text-sm font-semibold">Add new client</span>
        </button>
      </div>
    </div>
  );
}
