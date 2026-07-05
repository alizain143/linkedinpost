const LINKEDIN_CONNECT_WORKSPACE_KEY = "pp.linkedin.connectWorkspaceId";
const LINKEDIN_PRE_CONNECT_ACCOUNT_IDS_KEY = "pp.linkedin.preConnectAccountIds";
const LINKEDIN_PENDING_EXTERNAL_ACCOUNT_KEY =
  "pp.linkedin.pendingExternalAccountId";

export function writeLinkedInConnectWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LINKEDIN_CONNECT_WORKSPACE_KEY, workspaceId);
}

export function readLinkedInConnectWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(LINKEDIN_CONNECT_WORKSPACE_KEY);
}

export function clearLinkedInConnectWorkspaceId() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LINKEDIN_CONNECT_WORKSPACE_KEY);
}

export function writeLinkedInPreConnectAccountIds(accountIds: string[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    LINKEDIN_PRE_CONNECT_ACCOUNT_IDS_KEY,
    JSON.stringify(accountIds),
  );
}

export function readLinkedInPreConnectAccountIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.sessionStorage.getItem(LINKEDIN_PRE_CONNECT_ACCOUNT_IDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function clearLinkedInPreConnectAccountIds() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LINKEDIN_PRE_CONNECT_ACCOUNT_IDS_KEY);
}

export function writeLinkedInPendingExternalAccountId(accountId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LINKEDIN_PENDING_EXTERNAL_ACCOUNT_KEY, accountId);
}

export function readLinkedInPendingExternalAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(LINKEDIN_PENDING_EXTERNAL_ACCOUNT_KEY);
}

export function clearLinkedInPendingExternalAccountId() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LINKEDIN_PENDING_EXTERNAL_ACCOUNT_KEY);
}

export function clearLinkedInConnectSession() {
  clearLinkedInConnectWorkspaceId();
  clearLinkedInPreConnectAccountIds();
  clearLinkedInPendingExternalAccountId();
}
