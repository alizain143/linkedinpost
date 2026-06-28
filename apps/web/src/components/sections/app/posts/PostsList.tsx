"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { StatusBadge, appMuted } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { Button, filterVariant } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { useCreatePost, usePosts } from "@/hooks/api/use-posts-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { PostPackageStatus } from "@/lib/api/types/enums";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { getPostSourceLabel } from "@/lib/post-source";
import { getPostTypeLabel } from "@/lib/post-types";
import { usePpToast } from "@/providers/pp-toast-provider";

const ALL_STATUSES: PostPackageStatus[] = [
  "draft",
  "text_generating",
  "text_reviewing",
  "media_generating",
  "ready_for_approval",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
];

type PostsTab = "draft" | "scheduled" | "published" | "all";

const TABS: Array<{ id: PostsTab; label: string }> = [
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "all", label: "All" },
];

function statusFilterForTab(tab: PostsTab): PostPackageStatus[] {
  switch (tab) {
    case "draft":
      return ["draft"];
    case "scheduled":
      return ["scheduled", "publishing", "approved"];
    case "published":
      return ["published"];
    case "all":
      return ALL_STATUSES;
  }
}

function parseTab(value: string | null): PostsTab {
  if (value === "scheduled" || value === "published" || value === "all") {
    return value;
  }
  return "draft";
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-[#eceef4] bg-white"
        />
      ))}
    </div>
  );
}

export default function PostsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeWorkspaceId } = useWorkspace();
  const { showToast } = usePpToast();

  const initialTab = parseTab(searchParams.get("status"));
  const [activeTab, setActiveTab] = useState<PostsTab>(initialTab);
  const [showCreate, setShowCreate] = useState(false);
  const [newHook, setNewHook] = useState("");

  const listParams = useMemo(
    () => ({ status: statusFilterForTab(activeTab), limit: 50 }),
    [activeTab],
  );

  const { data: posts, isLoading, error, refetch } = usePosts(
    activeWorkspaceId,
    listParams,
  );
  const createPost = useCreatePost(activeWorkspaceId);

  const setTab = useCallback(
    (tab: PostsTab) => {
      setActiveTab(tab);
      router.replace(`/app/posts?status=${tab}`, { scroll: false });
    },
    [router],
  );

  const handleCreate = async () => {
    const hook = newHook.trim();
    if (!hook) {
      showToast("Enter a hook for your draft", "edit");
      return;
    }

    try {
      const post = await createPost.mutateAsync({ hook });
      showToast("Draft created", "draft");
      router.push(`/app/posts/${post.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const emptyMessage =
    activeTab === "draft"
      ? "No drafts yet."
      : activeTab === "scheduled"
        ? "No scheduled posts."
        : activeTab === "published"
          ? "No published posts yet."
          : "No posts in this workspace yet.";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className={appMuted}>
          Browse and manage posts in your workspace. Open a post to edit drafts or
          review content.
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setShowCreate((v) => !v)}
        >
          <MsIcon name="add" size={18} />
          Create draft
        </Button>
      </div>

      {showCreate ? (
        <div className="mb-5 rounded-2xl border border-[#eceef4] bg-white p-5">
          <InputField
            label="Hook"
            placeholder="I almost shut down my startup last year."
            value={newHook}
            onChange={(e) => setNewHook(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={createPost.isPending}
              onClick={() => void handleCreate()}
            >
              {createPost.isPending ? "Creating…" : "Create draft"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreate(false);
                setNewHook("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={filterVariant(activeTab === tab.id)}
            shape="pill"
            size="tab"
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!posts?.length}
        skeleton={<ListSkeleton />}
        empty={
          <div className="rounded-2xl border border-[#eceef4] bg-white px-5 py-10 text-center">
            <p className="text-[14px] text-[#64748b]">{emptyMessage}</p>
            {activeTab === "draft" ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreate(true)}
              >
                Create draft
              </Button>
            ) : null}
          </div>
        }
        onRetry={() => void refetch()}
      >
        <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
          <div className="divide-y divide-[#f1f3f8]">
            {posts?.map((post) => (
              <Link
                key={post.id}
                href={`/app/posts/${post.id}`}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-[#f8f9fc]"
              >
                <div className="min-w-0 flex-1 font-medium text-[#1e293b]">
                  {post.hook}
                </div>
                <span className="text-xs text-[#94a3b8]">
                  {getPostTypeLabel(post.postType) ?? "—"}
                </span>
                <StatusBadge status={post.status} />
                <span className="text-xs text-[#94a3b8]">
                  {getPostSourceLabel(post.source)}
                </span>
                {post.score != null ? (
                  <span className="font-display text-xs font-bold text-[#4f46e5]">
                    {post.score}/100
                  </span>
                ) : (
                  <MsIcon name="hourglass_empty" size={16} className="text-[#cbd2e0]" />
                )}
                <span className="text-xs text-[#94a3b8]">
                  {formatRelativeTime(post.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </QueryState>
    </div>
  );
}
