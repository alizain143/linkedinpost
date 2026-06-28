"use client";

import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useWorkspaces } from "@/hooks/api/use-workspaces-api";
import type { ApiWorkspace } from "@/lib/api/types/workspace";
import {
  readStoredWorkspaceId,
  resolveActiveWorkspaceId,
  writeStoredWorkspaceId,
} from "@/lib/workspace-storage";

type WorkspaceContextValue = {
  workspaces: ApiWorkspace[];
  activeWorkspace: ApiWorkspace | null;
  activeWorkspaceId: string | null;
  setActiveWorkspace: (workspaceId: string) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlWorkspaceId = searchParams.get("ws");

  const { data: user } = useCurrentUser();
  const {
    data: workspacesData,
    isLoading: workspacesLoading,
    isFetched: workspacesFetched,
    error: workspacesError,
    refetch,
  } = useWorkspaces();

  const workspaces = workspacesData ?? [];
  const authReady = isLoaded && isSignedIn;
  const isLoading = !authReady || workspacesLoading;

  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(
    null,
  );

  const resolvedId = useMemo(() => {
    return resolveActiveWorkspaceId(workspaces, {
      urlWorkspaceId,
      storedWorkspaceId: readStoredWorkspaceId(),
      defaultWorkspaceId: user?.defaultWorkspaceId,
    });
  }, [workspaces, urlWorkspaceId, user?.defaultWorkspaceId]);

  useEffect(() => {
    if (workspacesLoading || workspaces.length === 0) return;

    if (resolvedId && resolvedId !== activeWorkspaceId) {
      setActiveWorkspaceIdState(resolvedId);
      writeStoredWorkspaceId(resolvedId);
    }
  }, [workspacesLoading, workspaces.length, resolvedId, activeWorkspaceId]);

  const setActiveWorkspace = useCallback(
    (workspaceId: string) => {
      const exists = workspaces.some((workspace) => workspace.id === workspaceId);
      if (!exists) return;

      setActiveWorkspaceIdState(workspaceId);
      writeStoredWorkspaceId(workspaceId);

      const params = new URLSearchParams(searchParams.toString());
      params.set("ws", workspaceId);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [workspaces, searchParams, pathname, router],
  );

  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  }, [activeWorkspaceId, workspaces]);

  const error = useMemo(() => {
    if (workspacesError) {
      return workspacesError instanceof Error
        ? workspacesError
        : new Error("Failed to load workspaces");
    }
    if (workspacesFetched && workspaces.length === 0) {
      return new Error("No workspace found");
    }
    return null;
  }, [workspacesError, workspacesFetched, workspaces.length]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      setActiveWorkspace,
      isLoading,
      error,
      refetch: () => {
        void refetch();
      },
    }),
    [
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      setActiveWorkspace,
      isLoading,
      error,
      refetch,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  }
  return context;
}

export function useWorkspaceContextOptional(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
