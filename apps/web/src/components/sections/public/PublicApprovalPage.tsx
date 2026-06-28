"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryState } from "@/components/app/query-state";
import { RequestChangesModal } from "@/components/modals/request-changes-modal";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  usePublicApprovalPreview,
  usePublicApproveMutation,
  usePublicRejectMutation,
  usePublicRequestChangesMutation,
} from "@/hooks/api/use-public-approval-api";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { formatResetDate } from "@/lib/format-relative-time";
import { usePpToast } from "@/providers/pp-toast-provider";

type PublicApprovalPageProps = {
  token: string;
};

type SuccessAction = "approved" | "changes_requested" | "rejected";

function PreviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-[#eceef4]" />
      <div className="h-64 animate-pulse rounded-2xl bg-[#eceef4]" />
    </div>
  );
}

function InvalidLinkCard() {
  return (
    <div className="mx-auto w-full max-w-[520px] rounded-2xl border border-[#eceef4] bg-white px-6 py-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
        <MsIcon name="link_off" size={28} />
      </div>
      <h1 className="font-display text-[22px] font-bold text-[#1e293b]">
        Link unavailable
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#64748b]">
        This approval link is invalid, expired, or already used. Ask your agency
        contact for a new link if you still need to review the post.
      </p>
    </div>
  );
}

function SuccessCard({ action }: { action: SuccessAction }) {
  const copy =
    action === "approved"
      ? {
          icon: "check_circle",
          title: "Post approved",
          body: "Thanks for reviewing. Your agency has been notified and can schedule or publish the post.",
        }
      : action === "changes_requested"
        ? {
            icon: "rate_review",
            title: "Changes requested",
            body: "Your feedback was sent back to the agency team for revisions.",
          }
        : {
            icon: "cancel",
            title: "Post rejected",
            body: "The agency team has been notified. You can close this window.",
          };

  return (
    <div className="mx-auto w-full max-w-[520px] rounded-2xl border border-[#eceef4] bg-white px-6 py-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0fdf4] text-[#16a34a]">
        <MsIcon name={copy.icon} size={28} />
      </div>
      <h1 className="font-display text-[22px] font-bold text-[#1e293b]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#64748b]">
        {copy.body}
      </p>
    </div>
  );
}

export function PublicApprovalPage({ token }: PublicApprovalPageProps) {
  const { showToast } = usePpToast();
  const { data: preview, isLoading, error } = usePublicApprovalPreview(token);

  const approveMutation = usePublicApproveMutation(token);
  const requestChangesMutation = usePublicRequestChangesMutation(token);
  const rejectMutation = usePublicRejectMutation(token);

  const [successAction, setSuccessAction] = useState<SuccessAction | null>(null);
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [requestChangesError, setRequestChangesError] = useState<string | null>(
    null,
  );
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const isPending =
    approveMutation.isPending ||
    requestChangesMutation.isPending ||
    rejectMutation.isPending;

  const isInvalidLink =
    error instanceof ApiError && error.code === "APPROVAL_LINK_INVALID";

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync();
      setSuccessAction("approved");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleRequestChanges = async () => {
    const trimmed = feedback.trim();
    if (!trimmed) {
      setRequestChangesError("Please describe what should change.");
      return;
    }

    setRequestChangesError(null);
    try {
      await requestChangesMutation.mutateAsync({ feedback: trimmed });
      setRequestChangesOpen(false);
      setFeedback("");
      setSuccessAction("changes_requested");
    } catch (err) {
      setRequestChangesError(getApiErrorMessage(err));
    }
  };

  const handleReject = async () => {
    try {
      const trimmed = rejectFeedback.trim();
      await rejectMutation.mutateAsync(
        trimmed ? { feedback: trimmed } : {},
      );
      setRejectOpen(false);
      setRejectFeedback("");
      setSuccessAction("rejected");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  if (successAction) {
    return <SuccessCard action={successAction} />;
  }

  if (isInvalidLink) {
    return <InvalidLinkCard />;
  }

  return (
    <>
      <QueryState
        isLoading={isLoading}
        error={error && !isInvalidLink ? error : null}
        skeleton={<PreviewSkeleton />}
        empty={null}
      >
        {preview ? (
          <div className="mx-auto w-full max-w-[720px]">
            <div className="mb-6 text-center">
              <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
                Post review
              </p>
              <h1 className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.02em] text-[#0f172a]">
                Review for {preview.workspaceName}
              </h1>
              {preview.submittedForApprovalAt ? (
                <p className="mt-2 text-[14px] text-[#64748b]">
                  Submitted {formatResetDate(preview.submittedForApprovalAt)}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#eceef4] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                {preview.pillar ? (
                  <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-bold text-[#4f46e5]">
                    {preview.pillar}
                  </span>
                ) : null}
                {preview.postType ? (
                  <span className="rounded-full bg-[#f1f3f8] px-2.5 py-1 text-[11px] font-bold text-[#64748b]">
                    {preview.postType.replace(/_/g, " ")}
                  </span>
                ) : null}
              </div>

              <h2 className="font-display text-[20px] font-bold leading-snug text-[#1e293b]">
                {preview.hook}
              </h2>

              {preview.body ? (
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[#475569]">
                  {preview.body}
                </p>
              ) : null}

              {preview.cta ? (
                <p className="mt-4 text-[14px] font-semibold text-[#4f46e5]">
                  {preview.cta}
                </p>
              ) : null}

              {preview.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {preview.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {preview.media.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {preview.media.map((item, index) => (
                    <a
                      key={`${item.url}-${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-xl border border-[#eceef4]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.altText ?? "Post media"}
                        className="h-48 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}

              {preview.status === "ready_for_approval" ? (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-[#f1f3f8] pt-5">
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={isPending}
                    onClick={() => void handleApprove()}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setFeedback("");
                      setRequestChangesError(null);
                      setRequestChangesOpen(true);
                    }}
                  >
                    Request changes
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setRejectFeedback("");
                      setRejectOpen(true);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
                  This post is no longer awaiting approval.
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-[12px] text-[#94a3b8]">
              Powered by{" "}
              <Link href="/" className="font-semibold text-[#4f46e5]">
                linkedinpost.ai
              </Link>
            </p>
          </div>
        ) : null}
      </QueryState>

      <RequestChangesModal
        open={requestChangesOpen}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onClose={() => setRequestChangesOpen(false)}
        onSubmit={() => void handleRequestChanges()}
        isSubmitting={requestChangesMutation.isPending}
        errorMessage={requestChangesError}
      />

      {rejectOpen ? (
        <div
          className="animate-ppfade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
          onClick={() => setRejectOpen(false)}
          role="presentation"
        >
          <div
            className="animate-ppscale w-full max-w-[480px] rounded-[20px] bg-white p-[26px] shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="font-display text-[18px] font-bold text-[#1e293b]">
              Reject this post?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
              Optional: add a note explaining why you are rejecting it.
            </p>
            <div className="mt-4">
              <TextareaField
                label="Feedback (optional)"
                rows={4}
                value={rejectFeedback}
                onChange={(event) => setRejectFeedback(event.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="muted"
                size="sm"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={rejectMutation.isPending}
                onClick={() => void handleReject()}
              >
                Reject post
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
