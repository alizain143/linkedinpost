"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { StatusBadge } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { RequestChangesModal } from "@/components/modals/request-changes-modal";
import { Button, filterVariant } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { useApprovals } from "@/hooks/api/use-approvals-api";
import {
  useApplyPostChangesMutation,
  useApprovePostMutation,
  useRejectPostMutation,
  useRequestChangesPostMutation,
} from "@/hooks/api/use-posts-api";
import { trackProductEvent } from "@/lib/product-events";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { ApprovalTab } from "@/lib/api/types/approvals";
import {
  APPROVAL_TABS,
  approvalTabActions,
  getApprovalEmptyMessage,
  parseApprovalTab,
} from "@/lib/approval-tabs";
import {
  getApprovalMetadataLine,
  getApprovalPreviewLine,
  getApprovalScoreStyle,
} from "@/lib/approval-utils";
import { useAppUi } from "@/providers/app-ui-provider";

function ApprovalsSkeleton() {
  return (
    <div className="pp-2col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-2xl border border-[#eceef4] bg-white"
        />
      ))}
    </div>
  );
}

export default function Approvals() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeWorkspaceId } = useWorkspace();
  const { confirmRejectPost, showToast, openSchedule } = useAppUi();

  const initialTab = parseApprovalTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<ApprovalTab>(initialTab);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [requestChangesError, setRequestChangesError] = useState<string | null>(
    null,
  );

  const queryParams = useMemo(
    () => ({ tab: activeTab, limit: 20, offset: 0 }),
    [activeTab],
  );

  const { data, isLoading, error, refetch } = useApprovals(
    activeWorkspaceId,
    queryParams,
  );

  const approveMutation = useApprovePostMutation(activeWorkspaceId);
  const rejectMutation = useRejectPostMutation(activeWorkspaceId);
  const requestChangesMutation = useRequestChangesPostMutation(activeWorkspaceId);
  const applyChangesMutation = useApplyPostChangesMutation(activeWorkspaceId);

  const tabActions = approvalTabActions(activeTab);
  const isCardPending = (postId: string) =>
    activePostId === postId &&
    (approveMutation.isPending ||
      rejectMutation.isPending ||
      requestChangesMutation.isPending ||
      applyChangesMutation.isPending);

  const setTab = useCallback(
    (tab: ApprovalTab) => {
      setActiveTab(tab);
      router.replace(`/app/approvals?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  const handleApprove = async (postId: string) => {
    setActivePostId(postId);
    try {
      await approveMutation.mutateAsync({ postId });
      showToast("Post approved", "fact_check");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActivePostId(null);
    }
  };

  const openRequestChanges = (postId: string) => {
    setActivePostId(postId);
    setFeedback("");
    setRequestChangesError(null);
    setRequestChangesOpen(true);
  };

  const handleRequestChanges = async () => {
    if (!activePostId) return;
    const trimmed = feedback.trim();
    if (!trimmed) {
      setRequestChangesError("Please describe what should change.");
      return;
    }

    setRequestChangesError(null);
    try {
      await requestChangesMutation.mutateAsync({
        postId: activePostId,
        feedback: trimmed,
      });
      setRequestChangesOpen(false);
      setFeedback("");
      showToast("Changes requested", "rate_review");
    } catch (err) {
      setRequestChangesError(getApiErrorMessage(err));
    } finally {
      setActivePostId(null);
    }
  };

  const handleReject = (postId: string, title: string) => {
    confirmRejectPost(title, () => {
      setActivePostId(postId);
      void rejectMutation
        .mutateAsync({ postId })
        .catch((err) => {
          showToast(getApiErrorMessage(err), "error");
        })
        .finally(() => {
          setActivePostId(null);
        });
    });
  };

  const handleApplyChanges = async (postId: string) => {
    setActivePostId(postId);
    try {
      await applyChangesMutation.mutateAsync({ postId });
      trackProductEvent("changes_apply_manual");
      showToast("AI applied the requested changes", "auto_awesome");
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActivePostId(null);
    }
  };

  return (
    <div>
      <p className="mb-5 text-[14px] leading-relaxed text-[#64748b]">
        Review posts before they go live. Approve, request changes, or reject
        from one queue.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {APPROVAL_TABS.map((tab) => {
          const count = data?.counts[tab.id] ?? 0;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={filterVariant(activeTab === tab.id)}
              shape="pill"
              size="tab"
              onClick={() => setTab(tab.id)}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  activeTab === tab.id
                    ? "bg-white/20"
                    : "bg-[#eef2ff] text-[#4f46e5]"
                }`}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!data?.items.length}
        skeleton={<ApprovalsSkeleton />}
        empty={
          <div className="rounded-2xl border border-[#eceef4] bg-white px-5 py-10 text-center">
            <p className="text-[14px] text-[#64748b]">
              {getApprovalEmptyMessage(activeTab)}
            </p>
          </div>
        }
        onRetry={() => void refetch()}
      >
        <div className="pp-2col" data-tour="approvals-approve">
          {data?.items.map((item) => {
            const scoreStyle = getApprovalScoreStyle(item.score);
            const pending = isCardPending(item.id);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[#eceef4] bg-white p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                    </div>
                    <h3 className="font-display text-[15px] font-bold leading-snug text-[#1e293b]">
                      {item.hook}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#64748b]">
                      {getApprovalPreviewLine(item, activeTab)}
                    </p>
                  </div>
                  {item.score != null ? (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 font-display text-xs font-bold"
                      style={{
                        background: scoreStyle.bg,
                        color: scoreStyle.text,
                      }}
                    >
                      {item.score}/100
                    </span>
                  ) : null}
                </div>

                <div className="mb-4 flex flex-wrap gap-3 text-[11.5px] text-[#94a3b8]">
                  {getApprovalMetadataLine(item, activeTab)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    href={`/app/posts/${item.id}`}
                  >
                    <MsIcon name="fact_check" size={16} />
                    Review
                  </Button>
                  {tabActions.showApprove ? (
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      disabled={pending}
                      onClick={() => void handleApprove(item.id)}
                    >
                      Approve
                    </Button>
                  ) : null}
                  {tabActions.showRequestChanges ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => openRequestChanges(item.id)}
                    >
                      Changes
                    </Button>
                  ) : null}
                  {tabActions.showReject ? (
                    <Button
                      type="button"
                      variant="destructive-outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleReject(item.id, item.hook)}
                    >
                      Reject
                    </Button>
                  ) : null}
                  {tabActions.showSchedule ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        openSchedule({
                          postId: item.id,
                          hook: item.hook,
                          mode: "schedule",
                        })
                      }
                    >
                      <MsIcon name="schedule" size={16} />
                      Schedule
                    </Button>
                  ) : null}
                  {tabActions.showApplyChanges ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => void handleApplyChanges(item.id)}
                    >
                      <MsIcon name="auto_awesome" size={16} />
                      Apply with AI (1 cr)
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>

      <RequestChangesModal
        open={requestChangesOpen}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onClose={() => {
          setRequestChangesOpen(false);
          setFeedback("");
          setRequestChangesError(null);
          setActivePostId(null);
        }}
        onSubmit={() => void handleRequestChanges()}
        isSubmitting={requestChangesMutation.isPending}
        errorMessage={requestChangesError}
      />
    </div>
  );
}
