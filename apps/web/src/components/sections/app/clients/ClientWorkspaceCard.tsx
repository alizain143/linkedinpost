"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import type { ApiWorkspace, ApiWorkspaceDetail } from "@/lib/api/types/workspace";
import {
  formatProfileStatus,
  getClientAvatarColor,
  getClientInitials,
  profileStatusClass,
} from "@/lib/client-workspace-utils";
import { useWorkspace } from "@/hooks/use-workspace";

type ClientWorkspaceCardProps = {
  workspace: ApiWorkspace;
  detail?: ApiWorkspaceDetail;
  isLoading?: boolean;
  onRemove: (workspace: ApiWorkspace) => void;
  isRemoving?: boolean;
};

export function ClientWorkspaceCard({
  workspace,
  detail,
  isLoading = false,
  onRemove,
  isRemoving = false,
}: ClientWorkspaceCardProps) {
  const router = useRouter();
  const { setActiveWorkspace } = useWorkspace();

  const profileStatus = formatProfileStatus(
    detail?.stats.hasDefaultProfile ?? false,
  );

  const handleOpen = () => {
    setActiveWorkspace(workspace.id);
    router.push("/app/dashboard");
  };

  return (
    <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${getClientAvatarColor(workspace.id)} font-display text-sm font-bold text-white`}
        >
          {getClientInitials(workspace.name)}
        </div>
        <div>
          <div className="font-display font-bold">{workspace.name}</div>
          <div className="text-xs text-[#94a3b8]">Client workspace</div>
        </div>
      </div>

      <div className="mt-4 flex gap-5 text-xs">
        <div>
          <div className="font-bold text-[#1e293b]">
            {isLoading ? "—" : (detail?.stats.draftCount ?? 0)}
          </div>
          <div className="text-[#94a3b8]">Drafts</div>
        </div>
        <div>
          <div className="font-bold text-[#1e293b]">
            {isLoading ? "—" : (detail?.stats.scheduledCount ?? 0)}
          </div>
          <div className="text-[#94a3b8]">Scheduled</div>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${profileStatusClass(profileStatus)}`}
          >
            {isLoading ? "…" : profileStatus}
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
          onClick={handleOpen}
        >
          Open
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-3 hover:bg-[#fef2f2] hover:text-[#dc2626]"
          disabled={isRemoving}
          onClick={() => onRemove(workspace)}
        >
          <MsIcon name="delete" size={18} />
        </Button>
      </div>
    </div>
  );
}
