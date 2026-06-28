"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { MsIcon } from "@/components/ui/ms-icon";
import { usePipeline } from "@/hooks/api/use-pipeline-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  columnHasMore,
  columnOverflowCount,
  flattenPipelinePosts,
  formatPipelineCardDate,
  formatPipelineCardSubtitle,
} from "@/lib/pipeline-utils";
import { getPostSourceLabel } from "@/lib/post-source";
import { getPostTypeLabel } from "@/lib/post-types";

const PIPELINE_LIMIT_PER_COLUMN = 20;

function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="pp-kanban">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-72 w-[268px] shrink-0 animate-pulse rounded-2xl border border-[#eceef4] bg-[#f8f9fc]"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl border border-[#eceef4] bg-white" />
    </div>
  );
}

export default function Pipeline() {
  const { activeWorkspaceId } = useWorkspace();
  const { data, isLoading, error, refetch } = usePipeline(activeWorkspaceId, {
    limitPerColumn: PIPELINE_LIMIT_PER_COLUMN,
  });

  const allPosts = data ? flattenPipelinePosts(data.columns) : [];

  return (
    <div>
      <p className="mb-5 text-[14px] text-[#64748b]">
        Track every post from brief to published across your content pipeline.
      </p>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!!data && allPosts.length === 0}
        skeleton={<PipelineSkeleton />}
        empty={
          <div className="rounded-2xl border border-[#eceef4] bg-white px-5 py-10 text-center">
            <p className="text-[14px] text-[#64748b]">
              No posts in your pipeline yet. Create a draft or generate content to
              get started.
            </p>
          </div>
        }
        onRetry={() => void refetch()}
      >
        {data ? (
          <>
            <div className="pp-kanban mb-6">
              {data.columns.map((column) => (
                <div
                  key={column.status}
                  className="w-[268px] shrink-0 rounded-2xl border border-[#eceef4] bg-[#f8f9fc]"
                >
                  <div className="flex items-center justify-between border-b border-[#eceef4] px-3.5 py-3">
                    <StatusBadge status={column.status} />
                    <span className="text-xs font-semibold text-[#94a3b8]">
                      {column.count}
                    </span>
                  </div>
                  <div className="space-y-2 p-2">
                    {column.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/app/posts/${post.id}`}
                        className="block cursor-pointer rounded-xl border border-[#eceef4] bg-white p-3 hover:border-[#dfe3f0]"
                      >
                        <span className="mb-2 inline-flex rounded-full bg-[#f1f3f8] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">
                          {getPostSourceLabel(post.source)}
                        </span>
                        <div className="text-[13px] font-semibold leading-snug text-[#1e293b]">
                          {post.hook}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10.5px] text-[#94a3b8]">
                          {formatPipelineCardSubtitle(post)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10.5px] text-[#94a3b8]">
                            {formatPipelineCardDate(post)}
                          </span>
                          {post.score != null ? (
                            <span className="rounded-full bg-[#eef2ff] px-1.5 py-0.5 text-[10px] font-bold text-[#4f46e5]">
                              {post.score}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                    {column.posts.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#cbd2e0]">
                        Empty
                      </div>
                    ) : null}
                    {columnHasMore(column) ? (
                      <p className="px-1 py-1 text-center text-[10.5px] text-[#94a3b8]">
                        +{columnOverflowCount(column)} more
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
              <div className="border-b border-[#f1f3f8] px-5 py-3.5 font-display text-sm font-bold">
                All pipeline items
              </div>
              <div className="divide-y divide-[#f1f3f8]">
                {allPosts.map((post) => (
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
                      <MsIcon
                        name="hourglass_empty"
                        size={16}
                        className="text-[#cbd2e0]"
                      />
                    )}
                    <span className="text-xs text-[#94a3b8]">
                      {formatRelativeTime(post.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
