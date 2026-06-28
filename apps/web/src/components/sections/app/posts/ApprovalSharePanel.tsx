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
import { useAppUi } from "@/providers/app-ui-provider";
import { usePpToast } from "@/providers/pp-toast-provider";

type ApprovalSharePanelProps = {
  workspaceId: string;
  postId: string;
};

export function ApprovalSharePanel({
  workspaceId,
  postId,
}: ApprovalSharePanelProps) {
  const { balance } = useCredits();
  const { askConfirm } = useAppUi();
  const { showToast } = usePpToast();

  const plan = balance?.plan ?? "free";
  const agencyAllowed = canUseApprovalShareLinks(plan);

  const {
    data: linkStatus,
    isLoading,
    error,
    refetch,
  } = useApprovalLinkStatus(workspaceId, postId);
  const createMutation = useCreateApprovalLinkMutation(workspaceId, postId);
  const revokeMutation = useRevokeApprovalLinkMutation(workspaceId, postId);

  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);
  const [lastCreatedExpiresAt, setLastCreatedExpiresAt] = useState<string | null>(
    null,
  );

  const activeLink = linkStatus?.active ?? false;
  const copyableUrl = lastCreatedUrl;
  const expiresAt = lastCreatedExpiresAt ?? linkStatus?.expiresAt;

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync();
      setLastCreatedUrl(result.url);
      setLastCreatedExpiresAt(result.expiresAt);
      showToast("Share link created", "link");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
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
          <h3 className={appSectionTitle}>Share for approval</h3>
          <p className={`mt-1 ${appMutedSm}`}>
            Send a single-use link so your client can approve without signing in.
          </p>
        </div>
        {agencyAllowed && activeLink ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-bold text-[#16a34a]">
            <MsIcon name="link" size={14} />
            Link active
          </span>
        ) : null}
      </div>

      {!agencyAllowed ? (
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
          isLoading={isLoading}
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
                  Generate a new link to copy a fresh URL.
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
                onClick={() => void handleCreate()}
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
              Links are single-use and expire after 14 days.{" "}
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
