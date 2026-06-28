export const ACTIVE_WORKSPACE_STORAGE_KEY = "pp_active_workspace_id";

export function readStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
}

export function writeStoredWorkspaceId(workspaceId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
}

export function resolveActiveWorkspaceId(
  workspaces: Array<{ id: string; type: string }>,
  options: {
    urlWorkspaceId?: string | null;
    storedWorkspaceId?: string | null;
    defaultWorkspaceId?: string | null;
  },
): string | null {
  if (workspaces.length === 0) return null;

  const isValid = (id: string | null | undefined) =>
    !!id && workspaces.some((workspace) => workspace.id === id);

  if (isValid(options.urlWorkspaceId)) {
    return options.urlWorkspaceId!;
  }

  if (isValid(options.storedWorkspaceId)) {
    return options.storedWorkspaceId!;
  }

  if (isValid(options.defaultWorkspaceId)) {
    return options.defaultWorkspaceId!;
  }

  const personal = workspaces.find((workspace) => workspace.type === "personal");
  if (personal) return personal.id;

  return workspaces[0]?.id ?? null;
}
