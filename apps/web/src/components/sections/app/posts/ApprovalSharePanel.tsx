"use client";

import Link from "next/link";
import { useState } from "react";
import { appCard, appMutedSm, appSectionTitle } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { useCredits } from "@/hooks/api/use-credits-api";
import {
  useApprovalLinkStatus,
  useCreateApprovalLinkMutation,
  useRevokeApprovalLinkMutation,
} from "@/hooks/api/use-approval-share-api";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import {
  canUseApprovalShareLinks,
  copyApprovalLink,
  formatApprovalLinkExpiry,
} from "@/lib/approval-share-utils";
import { getPlanGateState } from "@/lib/plan-gate-utils";
import { useAppUi } from "@/providers/app-ui-provider";
import { usePpToast } from "@/providers/pp-toast-provider";

type ApprovalSharePanelProps = {
  workspaceId: string;
  postId: string;
};

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 animate-pulse rounded-xl bg-[#eceef4]" />
      <div className="h-9 w-40 animate-pulse rounded-lg bg-[#eceef4]" />
    </div>
  );
}

export function ApprovalSharePanel({
  workspaceId,
  postId,
}: ApprovalSharePanelProps) {
  const {
    balance,
    isLoading: creditsLoading,
    isError: creditsError,
    refetch: refetchCredits,
  } = useCredits();
  const { askConfirm } = useAppUi();
  const { showToast } = usePpToast();

  const planGate = getPlanGateState({
    isLoading: creditsLoading,
    isError: creditsError,
    balance,
  });
  const agencyAllowed =
    planGate.status === "ready" &&
    planGate.plan != null &&
    canUseApprovalShareLinks(planGate.plan);

  const {
    data: linkStatus,
    isLoading: linkLoading,
    error,
    refetch,
  } = useApprovalLinkStatus(workspaceId, postId, agencyAllowed, {
    pollWhileActive: true,
    refreshRelatedOnDeactivate: true,
  });
  const createMutation = useCreateApprovalLinkMutation(workspaceId, postId);
  const revokeMutation = useRevokeApprovalLinkMutation(workspaceId, postId);

  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);
  const [lastCreatedExpiresAt, setLastCreatedExpiresAt] = useState<string | null>(
    null,
  );

  const activeLink = linkStatus?.active ?? false;
  const copyableUrl = lastCreatedUrl;
  const expiresAt = lastCreatedExpiresAt ?? linkStatus?.expiresAt;

  const runCreate = async () => {
    try {
      const result = await createMutation.mutateAsync();
      setLastCreatedUrl(result.url);
      setLastCreatedExpiresAt(result.expiresAt);

      const copied = await copyApprovalLink(result.url);
      if (copied) {
        showToast("Share link copied to clipboard", "content_copy");
      } else {
        showToast("Share link created — copy it before leaving this page", "link");
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleCreate = () => {
    if (activeLink || copyableUrl) {
      askConfirm({
        icon: "link",
        tone: "neutral",
        title: "Generate a new share link?",
        body:
          "This invalidates the current link. If you already sent it to your client, they will need the new URL.",
        confirmLabel: "Generate new link",
        onConfirm: () => {
          void runCreate();
        },
      });
      return;
    }

    void runCreate();
  };

  const handleCopy = async () => {
    if (!copyableUrl) return;

    const copied = await copyApprovalLink(copyableUrl);
    if (copied) {
      showToast("Link copied to clipboard", "content_copy");
    } else {
      showToast("Could not copy link. Copy it manually from the field.", "error");
    }
  };

  const handleRevoke = () => {
    askConfirm({
      icon: "link_off",
      tone: "neutral",
      title: "Revoke share link?",
      body: "Anyone with the current link will no longer be able to review this post.",
      confirmLabel: "Revoke link",
      onConfirm: () => {
        void revokeMutation
          .mutateAsync()
          .then(() => {
            setLastCreatedUrl(null);
            setLastCreatedExpiresAt(null);
            showToast("Share link revoked", "link_off");
          })
          .catch((err) => {
            showToast(getApiErrorMessage(err), "error");
          });
      },
    });
  };

  return (
    <div className={`${appCard} p-5`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={appSectionTitle}>Share for client approval</h3>
          <p className={`mt-1 ${appMutedSm}`}>
            Optional — you can approve this post yourself using the button above.
            Use a share link when your client needs to review without signing in.
          </p>
        </div>
        {agencyAllowed && activeLink ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-bold text-[#16a34a]">
            <MsIcon name="link" size={14} />
            Link active
          </span>
        ) : null}
      </div>

      {planGate.status === "loading" ? (
        <PanelSkeleton />
      ) : planGate.status === "error" ? (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
          <p className="text-[13px] text-[#b91c1c]">
            Could not load your plan. Try again before creating a share link.
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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-[#fffdf5] px-4 py-3">
          <div className="min-w-[200px] flex-1">
            <div className="font-display text-[14px] font-bold text-[#92400e]">
              Upgrade to Agency for approval share links
            </div>
            <div className="text-[13px] text-[#a16207]">
              Generate secure links clients can use to review and approve posts.
            </div>
          </div>
          <Button
            href="/app/billing"
            variant="primary"
            size="sm"
            className="shrink-0 rounded-[10px]"
          >
            View plans
          </Button>
        </div>
      ) : (
        <QueryState
          isLoading={linkLoading}
          error={error}
          onRetry={() => void refetch()}
        >
          <div className="space-y-4">
            {copyableUrl ? (
              <div className="space-y-3">
                <InputField
                  label="Share link"
                  value={copyableUrl}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopy()}
                  >
                    <MsIcon name="content_copy" size={16} />
                    Copy link
                  </Button>
                  {expiresAt ? (
                    <span className={`self-center ${appMutedSm}`}>
                      Expires {formatApprovalLinkExpiry(expiresAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : activeLink ? (
              <div className="rounded-xl border border-[#eceef4] bg-[#f8fafc] px-4 py-3">
                <p className="text-[13px] text-[#475569]">
                  A share link is active
                  {linkStatus?.expiresAt
                    ? ` until ${formatApprovalLinkExpiry(linkStatus.expiresAt)}`
                    : ""}
                  {linkStatus?.createdAt
                    ? `. Created ${formatApprovalLinkExpiry(linkStatus.createdAt)}.`
                    : "."}{" "}
                  Generate a new link to copy a fresh URL. This will invalidate
                  the link already sent to your client.
                </p>
              </div>
            ) : (
              <p className={appMutedSm}>
                No active share link yet. Generate one to send to your client.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={createMutation.isPending}
                onClick={handleCreate}
              >
                <MsIcon name="link" size={16} />
                {activeLink || copyableUrl ? "Generate new link" : "Generate share link"}
              </Button>
              {activeLink ? (
                <Button
                  type="button"
                  variant="muted"
                  size="sm"
                  disabled={revokeMutation.isPending}
                  onClick={handleRevoke}
                >
                  Revoke link
                </Button>
              ) : null}
            </div>

            <p className={appMutedSm}>
              Links are single-use after your client acts on them. Expiry is shown
              when you create a link.{" "}
              <Link href="/app/clients" className="font-semibold text-[#4f46e5]">
                Client workspaces
              </Link>{" "}
              help you manage posts per client.
            </p>
          </div>
        </QueryState>
      )}
    </div>
  );
}
