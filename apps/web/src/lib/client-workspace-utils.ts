import type { ApiWorkspace } from "@/lib/api/types/workspace";
import type { UserPlan } from "@/lib/api/types/enums";

export const AGENCY_MAX_CLIENT_WORKSPACES = 5;

const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-cyan-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-slate-700",
  "bg-rose-600",
  "bg-amber-600",
] as const;

export function canUseClientWorkspaces(plan: UserPlan): boolean {
  return plan === "agency";
}

export function filterClientWorkspaces(workspaces: ApiWorkspace[]): ApiWorkspace[] {
  return workspaces.filter((workspace) => workspace.type === "client");
}

export function getPersonalWorkspace(
  workspaces: ApiWorkspace[],
): ApiWorkspace | null {
  return workspaces.find((workspace) => workspace.type === "personal") ?? null;
}

export function getClientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getClientAvatarColor(workspaceId: string): string {
  let hash = 0;
  for (let index = 0; index < workspaceId.length; index += 1) {
    hash = (hash + workspaceId.charCodeAt(index)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0];
}

export function formatProfileStatus(hasDefaultProfile: boolean): string {
  return hasDefaultProfile ? "Complete" : "Setup needed";
}

export function profileStatusClass(status: string): string {
  if (status === "Complete") return "bg-[#f0fdf4] text-[#16a34a]";
  if (status === "Setup needed") return "bg-[#fff8eb] text-[#d97706]";
  return "bg-[#f1f3f8] text-[#64748b]";
}
