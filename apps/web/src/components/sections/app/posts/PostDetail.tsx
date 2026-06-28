"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  useDeletePost,
  usePost,
  usePostVersions,
  useTransitionPostStatus,
  useUpdatePost,
} from "@/hooks/api/use-posts-api";
import { useCancelScheduleMutation } from "@/hooks/api/use-scheduling-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { ApiPostPackage } from "@/lib/api/types/post";
import type { PostType } from "@/lib/api/types/enums";
import {
  formatRelativeTime,
  formatResetDate,
  formatScheduledDateTime,
} from "@/lib/format-relative-time";
import { getPostSourceLabel } from "@/lib/post-source";
import { POST_TYPE_SELECT_OPTIONS } from "@/lib/post-types";
import { TONE_OPTIONS } from "@/lib/form-options";
import { CouncilTimeline } from "@/components/sections/app/generate/CouncilTimeline";
import { ApprovalSharePanel } from "@/components/sections/app/posts/ApprovalSharePanel";
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

type PostDetailProps = {
  postId: string;
};

export default function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
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
  const cancelSchedule = useCancelScheduleMutation(activeWorkspaceId);

  const [form, setForm] = useState<PostFormState | null>(null);
  const isDraft = post?.status === "draft";
  const isEditable = isDraft;

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

  const handleSubmitForApproval = async () => {
    try {
      await transitionStatus.mutateAsync({ status: "ready_for_approval" });
      showToast("Submitted for approval", "fact_check");
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
          router.push("/app/posts");
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
      <Link
        href="/app/posts"
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5]"
      >
        <MsIcon name="arrow_back" size={16} />
        Back to posts
      </Link>

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
              <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
                <span className="font-semibold">Approval feedback: </span>
                {post.approvalFeedback}
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
              <h3 className={appSectionTitle}>Content</h3>
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

            {post.media.length > 0 ? (
              <div className={`${appCard} p-5`}>
                <h3 className={`${appSectionTitle} mb-3`}>Media</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {post.media.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-xl border border-[#eceef4]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.altText}
                        className="h-40 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
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
                  {versions?.map((version) => (
                    <div key={version.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#1e293b]">
                          Version {version.versionNumber}
                        </span>
                        <span className={appMutedSm}>
                          {formatRelativeTime(version.createdAt)}
                        </span>
                      </div>
                      <p className="truncate text-[13px] text-[#64748b]">
                        {version.hook ?? "Untitled"}
                      </p>
                    </div>
                  ))}
                </div>
              </QueryState>
            </div>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
