"use client";

import { useMemo, useState } from "react";
import { QueryState } from "@/components/app/query-state";
import { AddClientModal } from "@/components/sections/app/clients/AddClientModal";
import { ClientWorkspaceCard } from "@/components/sections/app/clients/ClientWorkspaceCard";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useClientWorkspaceDetails,
  useClientWorkspaces,
  useCreateClientWorkspace,
  useDeleteClientWorkspace,
} from "@/hooks/api/use-workspaces-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { ApiWorkspace } from "@/lib/api/types/workspace";
import {
  AGENCY_MAX_CLIENT_WORKSPACES,
  canUseClientWorkspaces,
  getPersonalWorkspace,
} from "@/lib/client-workspace-utils";
import { getPlanGateState } from "@/lib/plan-gate-utils";
import { useAppUi } from "@/providers/app-ui-provider";

function ClientsSkeleton() {
  return (
    <div className="pp-grid3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[220px] animate-pulse rounded-2xl bg-[#eceef4]"
        />
      ))}
    </div>
  );
}

export default function Clients() {
  const { confirmRemoveClient, showToast } = useAppUi();
  const { balance, isLoading: creditsLoading, isError: creditsError, refetch: refetchCredits } =
    useCredits();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    refetch: refetchWorkspaces,
  } = useWorkspace();

  const planGate = getPlanGateState({
    isLoading: creditsLoading,
    isError: creditsError,
    balance,
  });
  const agencyAllowed =
    planGate.status === "ready" &&
    planGate.plan != null &&
    canUseClientWorkspaces(planGate.plan);

  const {
    clientWorkspaces,
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useClientWorkspaces();

  const clientIds = useMemo(
    () => clientWorkspaces.map((workspace) => workspace.id),
    [clientWorkspaces],
  );

  const {
    detailsById,
    isLoading: detailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useClientWorkspaceDetails(clientIds);

  const createMutation = useCreateClientWorkspace();
  const deleteMutation = useDeleteClientWorkspace();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const atLimit = clientWorkspaces.length >= AGENCY_MAX_CLIENT_WORKSPACES;
  const canAddClient = agencyAllowed && !atLimit;
  const isLoading = clientsLoading;
  const queryError = clientsError || detailsError;

  const handleCreate = (body: Parameters<typeof createMutation.mutate>[0]) => {
    setModalError(null);

    createMutation.mutate(body, {
      onSuccess: (detail) => {
        setModalOpen(false);
        setActiveWorkspace(detail.id);
        showToast("Client created", "groups");
      },
      onError: (error) => {
        setModalError(getApiErrorMessage(error));
      },
    });
  };

  const handleRemove = (workspace: ApiWorkspace) => {
    confirmRemoveClient(workspace.name, () => {
      setRemovingId(workspace.id);

      deleteMutation.mutate(workspace.id, {
        onSuccess: () => {
          if (activeWorkspaceId === workspace.id) {
            const personal = getPersonalWorkspace(workspaces);
            if (personal) {
              setActiveWorkspace(personal.id);
            }
          }
          setRemovingId(null);
        },
        onError: (error) => {
          setRemovingId(null);
          showToast(getApiErrorMessage(error), "error");
        },
      });
    });
  };

  return (
    <div>
      {planGate.status === "loading" ? (
        <div className="mb-5 h-16 animate-pulse rounded-2xl bg-[#eceef4]" />
      ) : planGate.status === "error" ? (
        <div className="mb-5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4">
          <p className="text-[13px] text-[#b91c1c]">
            Could not load your plan. Retry before managing client workspaces.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void refetchCredits()}
          >
            Retry
          </Button>
        </div>
      ) : !agencyAllowed ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-[#fffdf5] px-5 py-4">
          <div className="min-w-[200px] flex-1">
            <div className="font-display text-[15px] font-bold text-[#92400e]">
              Upgrade to Agency for client workspaces
            </div>
            <div className="text-[13px] text-[#a16207]">
              Manage up to 5 client workspaces with separate pipelines,
              calendars, and content profiles.
            </div>
          </div>
          <Button
            href="/app/billing"
            variant="primary"
            size="md"
            className="shrink-0 rounded-[10px]"
          >
            View plans
          </Button>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#64748b]">
          <span className="font-semibold text-[#1e293b]">
            {clientWorkspaces.length} client workspace
            {clientWorkspaces.length === 1 ? "" : "s"}
          </span>
          {" · "}
          {agencyAllowed
            ? `Agency plan · ${clientWorkspaces.length}/${AGENCY_MAX_CLIENT_WORKSPACES} used`
            : "Agency plan required"}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="rounded-[10px]"
          disabled={!canAddClient || createMutation.isPending}
          onClick={() => {
            setModalError(null);
            setModalOpen(true);
          }}
        >
          <MsIcon name="add" size={17} />
          Add client
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        error={queryError}
        onRetry={() => {
          void refetchClients();
          void refetchDetails();
          refetchWorkspaces();
        }}
        skeleton={<ClientsSkeleton />}
      >
        <div className="pp-grid3">
          {clientWorkspaces.map((workspace) => (
            <ClientWorkspaceCard
              key={workspace.id}
              workspace={workspace}
              detail={detailsById.get(workspace.id)}
              isLoading={detailsLoading && !detailsById.has(workspace.id)}
              onRemove={handleRemove}
              isRemoving={removingId === workspace.id}
            />
          ))}

          {canAddClient ? (
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setModalOpen(true);
              }}
              className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8dce8] bg-white p-5 text-[#94a3b8] hover:border-[#cbd2e0] hover:bg-[#fafbff]"
            >
              <MsIcon name="add" size={28} className="mb-2" />
              <span className="text-sm font-semibold">Add new client</span>
            </button>
          ) : null}
        </div>

        {agencyAllowed && clientWorkspaces.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#64748b]">
            No client workspaces yet. Create one to manage content for a client
            in its own workspace.
          </p>
        ) : null}
      </QueryState>

      <AddClientModal
        open={modalOpen}
        onClose={() => {
          if (!createMutation.isPending) {
            setModalOpen(false);
            setModalError(null);
          }
        }}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        errorMessage={modalError}
      />
    </div>
  );
}
