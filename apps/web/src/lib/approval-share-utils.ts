import type { UserPlan } from "@/lib/api/types/enums";
import { formatResetDate } from "@/lib/format-relative-time";

export function canUseApprovalShareLinks(plan: UserPlan): boolean {
  return plan === "agency";
}

export function formatApprovalLinkExpiry(iso: string): string {
  return formatResetDate(iso);
}

export async function copyApprovalLink(url: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
