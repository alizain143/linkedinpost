"use client";

import { useEffect, useRef, useState } from "react";
import {
  getUserInitials,
  useCurrentUser,
} from "@/hooks/api/use-auth-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { MsIcon } from "@/components/ui/ms-icon";
import { QueryState } from "@/components/app/query-state";
import { cn } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  className?: string;
};

function workspaceTypeLabel(type: string) {
  return type === "client" ? "Client" : "Personal";
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { data: user } = useCurrentUser();
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspace,
    isLoading,
    error,
    refetch,
  } = useWorkspace();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const canSwitch = workspaces.length > 1;
  const initials = getUserInitials(user).slice(0, 1).toUpperCase() || "W";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        skeleton={
          <div className="h-[46px] animate-pulse rounded-[10px] bg-[#eceef4]" />
        }
      >
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-[10px] border border-[#eceef4] bg-[#f8f9fc] px-[11px] py-[9px] text-left",
            canSwitch && "hover:border-[#dbe0ea]",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={!canSwitch}
          onClick={() => {
            if (canSwitch) setOpen((value) => !value);
          }}
        >
          <div className="flex min-w-0 items-center gap-[9px]">
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-[#4f46e5] to-[#0891b2] font-display text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-bold leading-tight text-[#0f172a]">
                {activeWorkspace?.name ?? "Workspace"}
              </div>
              <div className="text-[10.5px] text-[#94a3b8]">
                {workspaceTypeLabel(activeWorkspace?.type ?? "personal")}
              </div>
            </div>
          </div>
          {canSwitch ? (
            <MsIcon
              name="unfold_more"
              size={17}
              className="shrink-0 text-[#94a3b8]"
            />
          ) : null}
        </button>

        {open && canSwitch ? (
          <div
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[10px] border border-[#eceef4] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
            role="listbox"
          >
            {workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspaceId;
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-[#eef2ff] text-[#4338ca]"
                      : "text-[#475569] hover:bg-[#f6f7fb]",
                  )}
                  onClick={() => {
                    setActiveWorkspace(workspace.id);
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold">
                      {workspace.name}
                    </div>
                    <div className="text-[10.5px] opacity-80">
                      {workspaceTypeLabel(workspace.type)}
                    </div>
                  </div>
                  {active ? (
                    <MsIcon name="check" size={16} className="shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
