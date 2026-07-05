"use client";

import { BackLink } from "@/components/app/back-link";
import { useAppBack } from "@/hooks/use-app-back";
import { useEffect, useMemo, useState } from "react";
import {
  StatusBadge,
  appCard,
  appMuted,
  appMutedSm,
  appSectionTitle,
} from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useCouncilHistory } from "@/hooks/api/use-council-api";
import { useGenerationJob } from "@/hooks/api/use-generation-api";
import {
  useDeletePost,
  useApplyPostChangesMutation,
  useApplyPostMediaVersionMutation,
  useApplyPostVersionMutation,
  useGeneratePostMediaMutation,
  usePost,
  usePostMediaVersions,
  usePostVersions,
  useApprovePostMutation,
  useTransitionPostStatus,
  useUpdatePost,
} from "@/hooks/api/use-posts-api";
import { PromptModal } from "@/components/modals/prompt-modal";
import {
  PostMediaVersionPreviewModal,
  PostTextVersionPreviewModal,
} from "@/components/modals/post-version-preview-modal";
import { trackProductEvent } from "@/lib/product-events";
import { useCancelScheduleMutation } from "@/hooks/api/use-scheduling-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { MEDIA_GENERATION_CREDIT_COST, QUICK_DRAFT_CREDIT_COST } from "@/lib/credit-costs";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { ApiPostMedia, ApiPostPackage, ApiPostVersion } from "@/lib/api/types/post";
import type { PostType } from "@/lib/api/types/enums";
import {
  formatRelativeTime,
  formatResetDate,
  formatScheduledDateTime,
} from "@/lib/format-relative-time";
import { getPostSourceLabel } from "@/lib/post-source";
import { POST_TYPE_SELECT_OPTIONS } from "@/lib/post-types";
import { versionMatchesPost } from "@/lib/post-version-utils";
import { TONE_OPTIONS } from "@/lib/form-options";
import { CouncilTimeline } from "@/components/sections/app/generate/CouncilTimeline";
import { ApprovalSharePanel } from "@/components/sections/app/posts/ApprovalSharePanel";
import { PostMediaList } from "@/components/ui/post-media-image";
import { MediaGeneratingSkeleton } from "@/components/ui/media-generating-skeleton";
import { useAppUi } from "@/providers/app-ui-provider";
import { usePpToast } from "@/providers/pp-toast-provider";

type PostFormState = {
  hook: string;
  body: string;
  cta: string;
  tags: string;
  topic: string;
  postType: PostType | "";
  tone: string;
  pillar: string;
  contentProfileId: string;
};

function postToForm(post: ApiPostPackage): PostFormState {
  return {
    hook: post.hook,
    body: post.body ?? "",
    cta: post.cta ?? "",
    tags: post.tags.join(", "),
    topic: post.topic ?? "",
    postType: post.postType ?? "",
    tone: post.tone ?? "",
    pillar: post.pillar ?? "",
    contentProfileId: post.contentProfileId ?? "",
  };
}

function parseTags(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#eceef4]" />
      <div className="h-40 animate-pulse rounded-2xl bg-[#eceef4]" />
      <div className="h-64 animate-pulse rounded-2xl bg-[#eceef4]" />
    </div>
  );
}

function buildMediaVersionNumbers(items: ApiPostMedia[]): Map<string, number> {
  const chronological = [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return new Map(chronological.map((item, index) => [item.id, index + 1]));
}

type PostDetailProps = {
  postId: string;
};

export default function PostDetail({ postId }: PostDetailProps) {
  const goBack = useAppBack("/app/posts");
  const { activeWorkspaceId } = useWorkspace();
  const { confirmDeleteDraft, toastSaved, openSchedule, confirmPublishNow, askConfirm } =
    useAppUi();
  const { showToast } = usePpToast();

  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = usePost(activeWorkspaceId, postId, { pollWhileAwaitingApproval: true });
  const {
    data: versions,
    isLoading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions,
  } = usePostVersions(activeWorkspaceId, postId);
  const {
    data: mediaVersions,
    isLoading: mediaVersionsLoading,
    error: mediaVersionsError,
    refetch: refetchMediaVersions,
  } = usePostMediaVersions(activeWorkspaceId, postId);
  const { data: profiles } = useContentProfiles(activeWorkspaceId);
  const {
    data: councilHistory,
    isLoading: councilLoading,
    error: councilError,
    refetch: refetchCouncil,
  } = useCouncilHistory(activeWorkspaceId, postId);

  const latestCouncilRun = councilHistory?.runs[0];

  const updatePost = useUpdatePost(activeWorkspaceId, postId);
  const deletePost = useDeletePost(activeWorkspaceId);
  const transitionStatus = useTransitionPostStatus(activeWorkspaceId, postId);
  const approvePostMutation = useApprovePostMutation(activeWorkspaceId);
  const generatePostMedia = useGeneratePostMediaMutation(activeWorkspaceId);
  const applyPostChanges = useApplyPostChangesMutation(activeWorkspaceId);
  const applyPostVersion = useApplyPostVersionMutation(activeWorkspaceId, postId);
  const applyPostMediaVersion = useApplyPostMediaVersionMutation(
    activeWorkspaceId,
    postId,
  );
  const cancelSchedule = useCancelScheduleMutation(activeWorkspaceId);
  const { canAfford } = useCredits();

  const [activeMediaJobId, setActiveMediaJobId] = useState<string | null>(null);
  const [mediaPromptOpen, setMediaPromptOpen] = useState(false);
  const [mediaPrompt, setMediaPrompt] = useState("");
  const [textRegenPromptOpen, setTextRegenPromptOpen] = useState(false);
  const [textRegenPrompt, setTextRegenPrompt] = useState("");
  const [previewTextVersion, setPreviewTextVersion] =
    useState<ApiPostVersion | null>(null);
  const [previewMediaVersion, setPreviewMediaVersion] =
    useState<ApiPostMedia | null>(null);

  const mediaVersionNumbers = useMemo(
    () => buildMediaVersionNumbers(mediaVersions ?? []),
    [mediaVersions],
  );

  useGenerationJob(activeMediaJobId, {
    poll: true,
    workspaceId: activeWorkspaceId,
    onCompleted: () => {
      showToast("Media ready", "image");
      setActiveMediaJobId(null);
      void refetch();
      void refetchMediaVersions();
    },
  });

  const [form, setForm] = useState<PostFormState | null>(null);
  const isDraft = post?.status === "draft";
  const isReadyForApproval = post?.status === "ready_for_approval";
  const isMediaGenerating =
    post?.status === "media_generating" ||
    generatePostMedia.isPending ||
    !!activeMediaJobId;
  const isEditable =
    (isDraft || isReadyForApproval) && !isMediaGenerating;

  useEffect(() => {
    if (post) setForm(postToForm(post));
  }, [post]);

  const handleSave = async () => {
    if (!form || !isEditable) return;

    try {
      await updatePost.mutateAsync({
        hook: form.hook.trim(),
        body: optionalField(form.body),
        cta: optionalField(form.cta),
        tags: parseTags(form.tags),
        topic: optionalField(form.topic),
        postType: form.postType || undefined,
        tone: optionalField(form.tone),
        pillar: optionalField(form.pillar),
        contentProfileId: form.contentProfileId || undefined,
      });
      toastSaved();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleApplyTextVersion = async (versionNumber: number) => {
    try {
      await applyPostVersion.mutateAsync(versionNumber);
      setPreviewTextVersion(null);
      showToast("Text version restored", "history");
      void refetch();
      void refetchVersions();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleRegenerateText = () => {
    setTextRegenPrompt("");
    setTextRegenPromptOpen(true);
  };

  const confirmRegenerateText = async () => {
    if (!canAfford(QUICK_DRAFT_CREDIT_COST)) {
      showToast(
        `You need ${QUICK_DRAFT_CREDIT_COST} credit to regenerate text.`,
        "error",
      );
      return;
    }

    try {
      await applyPostChanges.mutateAsync({
        postId,
        additionalFeedback: textRegenPrompt.trim() || undefined,
      });
      setTextRegenPromptOpen(false);
      trackProductEvent("variant_regenerated");
      showToast("Post text regenerated", "auto_awesome");
      void refetch();
      void refetchVersions();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleApplyMediaVersion = async (mediaId: string) => {
    try {
      await applyPostMediaVersion.mutateAsync(mediaId);
      setPreviewMediaVersion(null);
      showToast("Media version restored", "image");
      void refetchMediaVersions();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await transitionStatus.mutateAsync({ status: "ready_for_approval" });
      showToast("Submitted for approval", "fact_check");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleApprove = async () => {
    try {
      await approvePostMutation.mutateAsync({ postId });
      showToast("Post approved", "check_circle");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleGenerateMedia = () => {
    setMediaPrompt("");
    setMediaPromptOpen(true);
  };

  const confirmGenerateMedia = async () => {
    if (!canAfford(MEDIA_GENERATION_CREDIT_COST)) {
      showToast(
        `You need ${MEDIA_GENERATION_CREDIT_COST} credits to generate an image.`,
        "error",
      );
      return;
    }

    try {
      const hasMedia = (post?.media.length ?? 0) > 0;
      const job = await generatePostMedia.mutateAsync({
        postId,
        mediaCustomPrompt: mediaPrompt.trim() || undefined,
        replace: hasMedia,
      });
      if (mediaPrompt.trim()) {
        trackProductEvent("media_generated_with_prompt");
      }
      setMediaPromptOpen(false);
      setActiveMediaJobId(job.id);
      void refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleDelete = () => {
    if (!post) return;
    confirmDeleteDraft(post.hook, () => {
      void deletePost
        .mutateAsync(postId)
        .then(() => {
          goBack();
        })
        .catch((err) => {
          showToast(getApiErrorMessage(err), "error");
        });
    });
  };

  const handleCancelSchedule = () => {
    if (!post) return;
    askConfirm({
      icon: "event_busy",
      tone: "neutral",
      title: "Cancel scheduled publish?",
      body: `"${post.hook}" will return to approved and be removed from your calendar.`,
      confirmLabel: "Cancel schedule",
      onConfirm: () => {
        void cancelSchedule
          .mutateAsync({ postId })
          .then(() => showToast("Schedule cancelled", "event_busy"))
          .catch((err) => showToast(getApiErrorMessage(err), "error"));
      },
    });
  };

  const canPublishNow =
    post?.status === "approved" ||
    post?.status === "scheduled" ||
    (post?.status === "failed" && !!post.publishErrorCode);

  const profileOptions = [
    { value: "", label: "None" },
    ...(profiles?.map((p) => ({ value: p.id, label: p.name })) ?? []),
  ];

  return (
    <div>
      <BackLink fallbackHref="/app/posts" />

      <QueryState
        isLoading={isLoading}
        error={error}
        skeleton={<DetailSkeleton />}
        onRetry={() => void refetch()}
      >
        {post && form ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={post.status} />
                  <span className={appMutedSm}>{getPostSourceLabel(post.source)}</span>
                  {post.score != null ? (
                    <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[11px] font-bold text-[#4f46e5]">
                      Score {post.score}/100
                    </span>
                  ) : null}
                  <span className={appMutedSm}>v{post.versionNumber}</span>
                </div>
                {!isEditable ? (
                  <p className={appMuted}>
                    This post is read-only. Only drafts can be edited or deleted.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {isDraft ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={updatePost.isPending}
                      onClick={() => void handleSave()}
                    >
                      {updatePost.isPending ? "Saving…" : "Save changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={transitionStatus.isPending}
                      onClick={() => void handleSubmitForApproval()}
                    >
                      Submit for approval
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deletePost.isPending}
                      onClick={handleDelete}
                    >
                      Delete draft
                    </Button>
                  </>
                ) : null}
                {post.status === "ready_for_approval" ? (
                  <>
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      disabled={approvePostMutation.isPending}
                      onClick={() => void handleApprove()}
                    >
                      <MsIcon name="check_circle" size={16} />
                      {approvePostMutation.isPending ? "Approving…" : "Approve"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={transitionStatus.isPending}
                      onClick={() =>
                        void transitionStatus
                          .mutateAsync({ status: "draft" })
                          .then(() => showToast("Returned to draft", "draft"))
                          .catch((err) =>
                            showToast(getApiErrorMessage(err), "error"),
                          )
                      }
                    >
                      Back to draft
                    </Button>
                  </>
                ) : null}
                {post.status === "approved" ? (
                  <>
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      onClick={() =>
                        openSchedule({
                          postId: post.id,
                          hook: post.hook,
                          mode: "schedule",
                        })
                      }
                    >
                      <MsIcon name="schedule" size={16} />
                      Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="linkedin"
                      size="sm"
                      onClick={() =>
                        confirmPublishNow({ postId: post.id, hook: post.hook })
                      }
                    >
                      <MsIcon name="send" size={16} />
                      Publish now
                    </Button>
                  </>
                ) : null}
                {post.status === "scheduled" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        openSchedule({
                          postId: post.id,
                          hook: post.hook,
                          mode: "reschedule",
                          scheduledAt: post.scheduledAt,
                        })
                      }
                    >
                      Reschedule
                    </Button>
                    <Button
                      type="button"
                      variant="muted"
                      size="sm"
                      disabled={cancelSchedule.isPending}
                      onClick={handleCancelSchedule}
                    >
                      Cancel schedule
                    </Button>
                    <Button
                      type="button"
                      variant="linkedin"
                      size="sm"
                      onClick={() =>
                        confirmPublishNow({ postId: post.id, hook: post.hook })
                      }
                    >
                      <MsIcon name="send" size={16} />
                      Publish now
                    </Button>
                  </>
                ) : null}
                {canPublishNow && post.status === "failed" ? (
                  <Button
                    type="button"
                    variant="linkedin"
                    size="sm"
                    onClick={() =>
                      confirmPublishNow({ postId: post.id, hook: post.hook })
                    }
                  >
                    <MsIcon name="send" size={16} />
                    Retry publish
                  </Button>
                ) : null}
                {post.status === "publishing" ? (
                  <span className={appMutedSm}>Publishing to LinkedIn…</span>
                ) : null}
              </div>
            </div>

            {post.approvalFeedback ? (
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
                <div>
                  <span className="font-semibold">Approval feedback: </span>
                  {post.approvalFeedback}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={applyPostChanges.isPending}
                  onClick={() => {
                    void applyPostChanges
                      .mutateAsync({ postId })
                      .then(() => {
                        trackProductEvent("changes_apply_manual");
                        showToast("AI applied the requested changes", "auto_awesome");
                        void refetch();
                        void refetchVersions();
                      })
                      .catch((err) => showToast(getApiErrorMessage(err), "error"));
                  }}
                >
                  <MsIcon name="auto_awesome" size={16} />
                  Apply with AI (1 cr)
                </Button>
              </div>
            ) : null}

            {post.status === "ready_for_approval" && activeWorkspaceId ? (
              <ApprovalSharePanel
                workspaceId={activeWorkspaceId}
                postId={post.id}
              />
            ) : null}

            {(post.scheduledAt ||
              post.publishedAt ||
              post.linkedInPostUrl ||
              post.publishErrorMessage) && (
              <div className={`${appCard} p-5`}>
                <h3 className={`${appSectionTitle} mb-3`}>Publishing</h3>
                <dl className="grid gap-2 text-[13px]">
                  {post.scheduledAt ? (
                    <div className="flex gap-2">
                      <dt className="text-[#94a3b8]">Scheduled</dt>
                      <dd className="text-[#1e293b]">
                        {formatScheduledDateTime(post.scheduledAt)} (
                        {formatResetDate(post.scheduledAt)})
                      </dd>
                    </div>
                  ) : null}
                  {post.publishedAt ? (
                    <div className="flex gap-2">
                      <dt className="text-[#94a3b8]">Published</dt>
                      <dd className="text-[#1e293b]">
                        {formatResetDate(post.publishedAt)}
                      </dd>
                    </div>
                  ) : null}
                  {post.linkedInPostUrl ? (
                    <div className="flex gap-2">
                      <dt className="text-[#94a3b8]">LinkedIn</dt>
                      <dd>
                        <a
                          href={post.linkedInPostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#4f46e5]"
                        >
                          View post
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {post.publishErrorMessage ? (
                    <div className="flex gap-2">
                      <dt className="text-[#94a3b8]">Error</dt>
                      <dd className="text-[#dc2626]">{post.publishErrorMessage}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}

            <div className={`${appCard} space-y-4 p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className={appSectionTitle}>Content</h3>
                {isEditable ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={applyPostChanges.isPending}
                    onClick={handleRegenerateText}
                  >
                    <MsIcon
                      name={
                        applyPostChanges.isPending
                          ? "progress_activity"
                          : "refresh"
                      }
                      size={16}
                      className={
                        applyPostChanges.isPending ? "animate-ppspin" : undefined
                      }
                    />
                    {applyPostChanges.isPending
                      ? "Regenerating…"
                      : `Regenerate (${QUICK_DRAFT_CREDIT_COST} cr)`}
                  </Button>
                ) : null}
              </div>
              <InputField
                label="Hook"
                value={form.hook}
                disabled={!isEditable}
                onChange={(e) => setForm({ ...form, hook: e.target.value })}
              />
              <TextareaField
                label="Body"
                rows={8}
                value={form.body}
                disabled={!isEditable}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
              <InputField
                label="CTA"
                value={form.cta}
                disabled={!isEditable}
                onChange={(e) => setForm({ ...form, cta: e.target.value })}
              />
              <InputField
                label="Tags"
                hint="Comma-separated"
                value={form.tags}
                disabled={!isEditable}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Topic"
                  value={form.topic}
                  disabled={!isEditable}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                />
                <SelectField
                  label="Post type"
                  value={form.postType}
                  disabled={!isEditable}
                  options={[
                    { value: "", label: "None" },
                    ...POST_TYPE_SELECT_OPTIONS,
                  ]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      postType: e.target.value as PostType | "",
                    })
                  }
                />
                <SelectField
                  label="Tone"
                  value={form.tone}
                  disabled={!isEditable}
                  options={["", ...TONE_OPTIONS]}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                />
                <InputField
                  label="Pillar"
                  value={form.pillar}
                  disabled={!isEditable}
                  onChange={(e) => setForm({ ...form, pillar: e.target.value })}
                />
                <SelectField
                  label="Content profile"
                  value={form.contentProfileId}
                  disabled={!isEditable}
                  options={profileOptions}
                  onChange={(e) =>
                    setForm({ ...form, contentProfileId: e.target.value })
                  }
                />
              </div>
            </div>

            {(post.media.length > 0 || isMediaGenerating || isEditable) ? (
              <div className={`${appCard} p-5`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className={appSectionTitle}>Media</h3>
                  {isEditable ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isMediaGenerating}
                      onClick={() => void handleGenerateMedia()}
                    >
                      <MsIcon
                        name={
                          isMediaGenerating ? "progress_activity" : "refresh"
                        }
                        size={16}
                        className={isMediaGenerating ? "animate-ppspin" : undefined}
                      />
                      {isMediaGenerating
                        ? "Generating…"
                        : post.media.length > 0
                          ? `Regenerate (${MEDIA_GENERATION_CREDIT_COST} cr)`
                          : `Generate (${MEDIA_GENERATION_CREDIT_COST} cr)`}
                    </Button>
                  ) : null}
                </div>
                    {post.media.length === 0 && !isMediaGenerating ? (
                      <p className={`${appMuted} mb-4 text-[13px]`}>
                        No media yet. Generate an image for this post.
                      </p>
                    ) : null}
                    {isMediaGenerating && post.media.length === 0 ? (
                      <MediaGeneratingSkeleton label="Generating media…" />
                    ) : post.media.length > 0 ? (
                      <PostMediaList items={post.media} />
                    ) : null}
                {(mediaVersions?.length ?? 0) > 1 ? (
                  <div className="mt-5 border-t border-[#f1f3f8] pt-4">
                    <h4 className="mb-3 text-[13px] font-semibold text-[#1e293b]">
                      Media version history
                    </h4>
                    <QueryState
                      isLoading={mediaVersionsLoading}
                      error={mediaVersionsError}
                      onRetry={() => void refetchMediaVersions()}
                    >
                      <div className="divide-y divide-[#f1f3f8]">
                        {mediaVersions?.map((media) => {
                          const versionNumber =
                            mediaVersionNumbers.get(media.id) ?? 0;
                          const isCurrent = media.isActive;
                          return (
                            <div
                              key={media.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                            >
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                onClick={() => setPreviewMediaVersion(media)}
                              >
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[13px] font-semibold text-[#1e293b]">
                                    Version {versionNumber}
                                  </span>
                                  {isCurrent ? (
                                    <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10.5px] font-bold text-[#059669]">
                                      Current
                                    </span>
                                  ) : null}
                                  <span className={appMutedSm}>
                                    {formatRelativeTime(media.createdAt)}
                                  </span>
                                </div>
                                <p className="truncate text-[13px] text-[#64748b]">
                                  {media.altText || "Generated image"}
                                </p>
                              </button>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="muted"
                                  size="xs"
                                  onClick={() => setPreviewMediaVersion(media)}
                                >
                                  View
                                </Button>
                                {!isCurrent && isEditable ? (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="xs"
                                    disabled={applyPostMediaVersion.isPending}
                                    onClick={() =>
                                      void handleApplyMediaVersion(media.id)
                                    }
                                  >
                                    Use this version
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </QueryState>
                  </div>
                ) : null}
              </div>
            ) : null}

            {latestCouncilRun ? (
              <div className={`${appCard} p-5`}>
                <h3 className={`${appSectionTitle} mb-3`}>AI Council timeline</h3>
                <QueryState
                  isLoading={councilLoading}
                  error={councilError}
                  onRetry={() => void refetchCouncil()}
                >
                  <CouncilTimeline
                    events={latestCouncilRun.events}
                    status={latestCouncilRun.status}
                    errorMessage={
                      latestCouncilRun.status === "failed"
                        ? "Council run failed"
                        : null
                    }
                  />
                </QueryState>
              </div>
            ) : null}

            <div className={`${appCard} p-5`}>
              <h3 className={`${appSectionTitle} mb-3`}>Version history</h3>
              <QueryState
                isLoading={versionsLoading}
                error={versionsError}
                isEmpty={!versions?.length}
                empty={
                  <p className={appMuted}>No versions recorded yet.</p>
                }
                onRetry={() => void refetchVersions()}
              >
                <div className="divide-y divide-[#f1f3f8]">
                  {versions?.map((version) => {
                    const isCurrent = versionMatchesPost(version, post);
                    return (
                      <div
                        key={version.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setPreviewTextVersion(version)}
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#1e293b]">
                              Version {version.versionNumber}
                            </span>
                            {isCurrent ? (
                              <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10.5px] font-bold text-[#059669]">
                                Current
                              </span>
                            ) : null}
                            <span className={appMutedSm}>
                              {formatRelativeTime(version.createdAt)}
                            </span>
                          </div>
                          <p className="truncate text-[13px] text-[#64748b]">
                            {version.hook ?? "Untitled"}
                          </p>
                        </button>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="muted"
                            size="xs"
                            onClick={() => setPreviewTextVersion(version)}
                          >
                            View
                          </Button>
                          {!isCurrent && isEditable ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={applyPostVersion.isPending}
                              onClick={() =>
                                void handleApplyTextVersion(version.versionNumber)
                              }
                            >
                              Use this version
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </QueryState>
            </div>
          </div>
        ) : null}
      </QueryState>

      <PromptModal
        open={mediaPromptOpen}
        title="Image direction"
        description="Optional. Leave blank to let AI decide."
        confirmLabel={post?.media.length ? "Regenerate" : "Generate"}
        value={mediaPrompt}
        onChange={setMediaPrompt}
        onClose={() => setMediaPromptOpen(false)}
        onConfirm={() => void confirmGenerateMedia()}
        isSubmitting={generatePostMedia.isPending}
        creditCost={MEDIA_GENERATION_CREDIT_COST}
      />

      <PromptModal
        open={textRegenPromptOpen}
        title="Regenerate post text"
        description="Optional direction for the rewrite. Leave blank to regenerate in the same voice."
        placeholder="e.g. Make it shorter and more punchy"
        confirmLabel="Regenerate"
        value={textRegenPrompt}
        onChange={setTextRegenPrompt}
        onClose={() => setTextRegenPromptOpen(false)}
        onConfirm={() => void confirmRegenerateText()}
        isSubmitting={applyPostChanges.isPending}
        creditCost={QUICK_DRAFT_CREDIT_COST}
      />

      <PostTextVersionPreviewModal
        open={previewTextVersion != null}
        version={previewTextVersion}
        isCurrent={
          previewTextVersion != null && post != null
            ? versionMatchesPost(previewTextVersion, post)
            : false
        }
        isApplying={applyPostVersion.isPending}
        onClose={() => setPreviewTextVersion(null)}
        onApply={
          previewTextVersion && isEditable
            ? () => void handleApplyTextVersion(previewTextVersion.versionNumber)
            : undefined
        }
      />

      <PostMediaVersionPreviewModal
        open={previewMediaVersion != null}
        media={previewMediaVersion}
        versionNumber={
          previewMediaVersion
            ? (mediaVersionNumbers.get(previewMediaVersion.id) ?? 0)
            : 0
        }
        isCurrent={previewMediaVersion?.isActive ?? false}
        isApplying={applyPostMediaVersion.isPending}
        onClose={() => setPreviewMediaVersion(null)}
        onApply={
          previewMediaVersion && isEditable && !previewMediaVersion.isActive
            ? () => void handleApplyMediaVersion(previewMediaVersion.id)
            : undefined
        }
      />
    </div>
  );
}
