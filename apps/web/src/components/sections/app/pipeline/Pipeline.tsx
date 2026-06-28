"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { Button, segmentVariant } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useInvalidatePipeline,
  usePipeline,
} from "@/hooks/api/use-pipeline-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { transitionPostStatus } from "@/lib/api/posts";
import type { PostPackageStatus } from "@/lib/api/types/enums";
import type { ApiPostPackageSummary } from "@/lib/api/types/pipeline";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  columnHasMore,
  columnOverflowCount,
  canTransitionPostStatus,
  flattenPipelinePosts,
  formatPipelineCardDate,
  formatPipelineCardSubtitle,
  getManualStatusTransitions,
} from "@/lib/pipeline-utils";
import { getPostSourceLabel } from "@/lib/post-source";
import { getPostTypeLabel } from "@/lib/post-types";
import { getPostStatusLabel, POST_STATUS_STYLES } from "@/lib/post-status";
import { cn } from "@/lib/utils";
import { usePpToast } from "@/providers/pp-toast-provider";

const PIPELINE_LIMIT_PER_COLUMN = 20;

type PipelineView = "kanban" | "list";

const VIEW_OPTIONS: PipelineView[] = ["kanban", "list"];

const VIEW_ICONS: Record<PipelineView, string> = {
  kanban: "view_kanban",
  list: "view_list",
};

function parsePipelineView(value: string | null): PipelineView {
  if (value === "list" || value === "kanban") {
    return value;
  }
  return "kanban";
}

const DRAG_DROP_COLUMNS = new Set<PostPackageStatus>([
  "draft",
  "ready_for_approval",
  "approved",
]);

function canDropOnColumn(
  fromStatus: PostPackageStatus,
  columnStatus: PostPackageStatus,
): boolean {
  return (
    DRAG_DROP_COLUMNS.has(columnStatus) &&
    canTransitionPostStatus(fromStatus, columnStatus)
  );
}

function isPipelineCardDraggable(status: PostPackageStatus): boolean {
  return DRAG_DROP_COLUMNS.has(status);
}

const KANBAN_SCROLL_EDGE_PX = 72;
const KANBAN_SCROLL_STEP_PX = 14;

type DragPayload = {
  postId: string;
  fromStatus: PostPackageStatus;
};

type DropHint = {
  columnStatus: PostPackageStatus;
  insertIndex: number;
};

function resolveInsertIndexFromPointer(
  clientY: number,
  columnBody: HTMLElement | null,
): number {
  if (!columnBody) return 0;

  const cards = columnBody.querySelectorAll<HTMLElement>("[data-pipeline-card]");
  if (cards.length === 0) return 0;

  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }

  return cards.length;
}

function PipelineKanbanSkeleton() {
  return (
    <div className="pp-kanban pp-kanban--expanded">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-72 w-[268px] shrink-0 animate-pulse rounded-2xl border border-[#eceef4] bg-[#f8f9fc]"
        />
      ))}
    </div>
  );
}

function PipelineListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-[58px] animate-pulse border-b border-[#f1f3f8] bg-[#fbfbfc] last:border-0"
        />
      ))}
    </div>
  );
}

type PipelineCardProps = {
  post: ApiPostPackageSummary;
  draggable: boolean;
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: () => void;
  isDragging: boolean;
};

function PipelineCard({
  post,
  draggable,
  onDragStart,
  onDragEnd,
  isDragging,
}: PipelineCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) return;
        const payload = { postId: post.id, fromStatus: post.status };
        event.dataTransfer.setData(
          "application/json",
          JSON.stringify(payload),
        );
        event.dataTransfer.effectAllowed = "move";
        onDragStart(payload);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border border-[#eceef4] bg-white p-3 transition-opacity ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-40" : "hover:border-[#dfe3f0]"}`}
    >
      <Link href={`/app/posts/${post.id}`} className="block" draggable={false}>
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
    </div>
  );
}

type PipelineListProps = {
  posts: ApiPostPackageSummary[];
  transitioningPostId: string | null;
  onStatusChange: (
    postId: string,
    fromStatus: PostPackageStatus,
    toStatus: PostPackageStatus,
  ) => void;
};

type PipelineListStatusMenuProps = {
  post: ApiPostPackageSummary;
  isOpen: boolean;
  isTransitioning: boolean;
  onOpen: () => void;
  onClose: () => void;
  onStatusChange: (toStatus: PostPackageStatus) => void;
};

function PipelineListStatusMenu({
  post,
  isOpen,
  isTransitioning,
  onOpen,
  onClose,
  onStatusChange,
}: PipelineListStatusMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const transitions = getManualStatusTransitions(post.status);
  const canChange = transitions.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, onClose]);

  if (!canChange) {
    return <StatusBadge status={post.status} />;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border border-[#e3e6ef] bg-white py-0.5 pl-1.5 pr-1 text-left transition-colors hover:border-[#cbd2e0] hover:bg-[#f8f9fc]",
          isOpen && "border-[#4f46e5] bg-[#eef2ff]",
          isTransitioning && "pointer-events-none opacity-60",
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Change status for ${post.hook}`}
        disabled={isTransitioning}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isOpen) onClose();
          else onOpen();
        }}
      >
        <StatusBadge status={post.status} />
        {isTransitioning ? (
          <MsIcon
            name="progress_activity"
            size={16}
            className="animate-ppspin text-[#94a3b8]"
          />
        ) : (
          <MsIcon name="expand_more" size={16} className="text-[#94a3b8]" />
        )}
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 z-20 mt-1.5 min-w-[196px] overflow-hidden rounded-xl border border-[#eceef4] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
          role="menu"
        >
          <p className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            Move to
          </p>
          {transitions.map((status) => {
            const style = POST_STATUS_STYLES[status];
            return (
              <button
                key={status}
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[#1e293b] transition-colors hover:bg-[#f8f9fc]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClose();
                  onStatusChange(status);
                }}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: style.text }}
                />
                {getPostStatusLabel(status)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PipelineList({
  posts,
  transitioningPostId,
  onStatusChange,
}: PipelineListProps) {
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
      <div className="divide-y divide-[#f1f3f8]">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-[#f8f9fc]"
          >
            <Link
              href={`/app/posts/${post.id}`}
              className="min-w-0 flex-1 font-medium text-[#1e293b] hover:text-[#4f46e5]"
            >
              {post.hook}
            </Link>
            <span className="text-xs text-[#94a3b8]">
              {getPostTypeLabel(post.postType) ?? "—"}
            </span>
            <PipelineListStatusMenu
              post={post}
              isOpen={openMenuPostId === post.id}
              isTransitioning={transitioningPostId === post.id}
              onOpen={() => setOpenMenuPostId(post.id)}
              onClose={() => setOpenMenuPostId(null)}
              onStatusChange={(toStatus) =>
                onStatusChange(post.id, post.status, toStatus)
              }
            />
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { showToast } = usePpToast();
  const invalidatePipeline = useInvalidatePipeline();
  const { data, isLoading, error, refetch } = usePipeline(activeWorkspaceId, {
    limitPerColumn: PIPELINE_LIMIT_PER_COLUMN,
  });

  const [view, setView] = useState<PipelineView>(() =>
    parsePipelineView(searchParams.get("view")),
  );

  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const [transitioningPostId, setTransitioningPostId] = useState<string | null>(
    null,
  );
  const kanbanRef = useRef<HTMLDivElement>(null);
  const columnBodyRefs = useRef<Partial<Record<PostPackageStatus, HTMLDivElement>>>(
    {},
  );
  const dragPointerXRef = useRef<number | null>(null);

  const allPosts = data ? flattenPipelinePosts(data.columns) : [];

  const handleViewChange = (nextView: PipelineView) => {
    setView(nextView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const pipelineSkeleton =
    view === "list" ? <PipelineListSkeleton /> : <PipelineKanbanSkeleton />;

  const scrollKanbanHorizontally = useCallback((clientX: number) => {
    const kanban = kanbanRef.current;
    if (!kanban) return;

    const { left, right } = kanban.getBoundingClientRect();
    if (clientX > right - KANBAN_SCROLL_EDGE_PX) {
      kanban.scrollLeft += KANBAN_SCROLL_STEP_PX;
    } else if (clientX < left + KANBAN_SCROLL_EDGE_PX) {
      kanban.scrollLeft -= KANBAN_SCROLL_STEP_PX;
    }
  }, []);

  useEffect(() => {
    if (!dragging) {
      dragPointerXRef.current = null;
      return;
    }

    let frame = 0;
    const tick = () => {
      const clientX = dragPointerXRef.current;
      if (clientX != null) {
        scrollKanbanHorizontally(clientX);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging, scrollKanbanHorizontally]);

  const trackDragPointer = useCallback((clientX: number) => {
    dragPointerXRef.current = clientX;
  }, []);

  const endDrag = useCallback(() => {
    setDragging(null);
    setDropHint(null);
  }, []);

  const updateDropHint = useCallback(
    (
      columnStatus: PostPackageStatus,
      clientY: number,
      acceptsDrop: boolean,
    ) => {
      if (!acceptsDrop) {
        setDropHint(null);
        return;
      }

      const insertIndex = resolveInsertIndexFromPointer(
        clientY,
        columnBodyRefs.current[columnStatus] ?? null,
      );
      setDropHint({ columnStatus, insertIndex });
    },
    [],
  );

  const handleDragOverColumn = useCallback(
    (
      event: React.DragEvent<HTMLElement>,
      columnStatus: PostPackageStatus,
      acceptsDrop: boolean,
    ) => {
      if (!dragging || !acceptsDrop) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      updateDropHint(columnStatus, event.clientY, acceptsDrop);
      trackDragPointer(event.clientX);
    },
    [dragging, trackDragPointer, updateDropHint],
  );

  const handleStatusTransition = async (
    postId: string,
    fromStatus: PostPackageStatus,
    toStatus: PostPackageStatus,
  ) => {
    if (
      !activeWorkspaceId ||
      !canTransitionPostStatus(fromStatus, toStatus)
    ) {
      return;
    }

    setTransitioningPostId(postId);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await transitionPostStatus(token, activeWorkspaceId, postId, {
        status: toStatus,
      });
      invalidatePipeline(activeWorkspaceId);
      showToast("Status updated", "check_circle");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setTransitioningPostId(null);
      endDrag();
    }
  };

  const handleDrop = async (
    columnStatus: PostPackageStatus,
    payload: DragPayload,
  ) => {
    if (!canDropOnColumn(payload.fromStatus, columnStatus)) {
      return;
    }
    await handleStatusTransition(
      payload.postId,
      payload.fromStatus,
      columnStatus,
    );
  };

  const parseDropPayload = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-[14px] text-[#64748b]">
          {view === "kanban"
            ? "Track every post from brief to published. Drag cards between Draft, Ready for Approval, and Approved to update status."
            : "All pipeline posts in one place. Use the status menu to move posts between stages, or open a row for full detail."}
        </p>
        <div
          className="flex gap-0.5 rounded-[10px] bg-[#eef0f5] p-0.5"
          role="group"
          aria-label="Pipeline view"
        >
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              variant={segmentVariant(view === option)}
              size="sm"
              className="rounded-[8px] px-3.5 py-1.5 capitalize"
              onClick={() => handleViewChange(option)}
            >
              <MsIcon name={VIEW_ICONS[option]} size={16} />
              {option}
            </Button>
          ))}
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!!data && allPosts.length === 0}
        skeleton={pipelineSkeleton}
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
          view === "list" ? (
            <PipelineList
              posts={allPosts}
              transitioningPostId={transitioningPostId}
              onStatusChange={(postId, fromStatus, toStatus) =>
                void handleStatusTransition(postId, fromStatus, toStatus)
              }
            />
          ) : (
            <div
              ref={kanbanRef}
              className="pp-kanban pp-kanban--expanded"
              onDragOver={(event) => {
                if (!dragging) return;
                trackDragPointer(event.clientX);
              }}
              onDragEnd={endDrag}
            >
              {data.columns.map((column) => {
                const acceptsDrop =
                  dragging != null &&
                  canDropOnColumn(dragging.fromStatus, column.status);
                const isDropTarget =
                  acceptsDrop && dropHint?.columnStatus === column.status;
                const insertIndex = isDropTarget ? dropHint.insertIndex : -1;

                return (
                  <div
                    key={column.status}
                    className={cn(
                      "pp-kanban-column pp-kanban-column--expanded w-[268px] shrink-0 border bg-[#f8f9fc] transition-colors",
                      isDropTarget
                        ? "pp-kanban-column--drop-target"
                        : "border-[#eceef4]",
                    )}
                    onDragOver={(event) =>
                      handleDragOverColumn(event, column.status, acceptsDrop)
                    }
                    onDragLeave={(event) => {
                      if (
                        event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      ) {
                        return;
                      }
                      if (dropHint?.columnStatus === column.status) {
                        setDropHint(null);
                      }
                    }}
                    onDrop={(event) => {
                      const payload = parseDropPayload(event);
                      if (payload) void handleDrop(column.status, payload);
                    }}
                  >
                    <div
                      className={cn(
                        "pp-kanban-column-header flex items-center justify-between border-b px-3.5 py-3 transition-colors",
                        isDropTarget
                          ? "pp-kanban-column-header--drop-target"
                          : "border-[#eceef4]",
                      )}
                    >
                      <StatusBadge status={column.status} />
                      <span className="text-xs font-semibold text-[#94a3b8]">
                        {column.count}
                      </span>
                    </div>
                    <div
                      ref={(node) => {
                        if (node) {
                          columnBodyRefs.current[column.status] = node;
                        }
                      }}
                      className={cn(
                        "pp-kanban-column-body space-y-2 p-2",
                        isDropTarget && "pp-kanban-column-body--receiving",
                      )}
                      onDragOver={(event) =>
                        handleDragOverColumn(event, column.status, acceptsDrop)
                      }
                      onDrop={(event) => {
                        const payload = parseDropPayload(event);
                        if (payload) void handleDrop(column.status, payload);
                      }}
                    >
                      {column.posts.map((post, index) => {
                        const isDraggable = isPipelineCardDraggable(post.status);
                        const isEndInsert =
                          isDropTarget && insertIndex === column.posts.length;
                        const shiftsAbove =
                          isDropTarget && !isEndInsert && index < insertIndex;
                        const shiftsBelow =
                          isDropTarget && !isEndInsert && index >= insertIndex;
                        const showsGapMarker =
                          isDropTarget &&
                          !isEndInsert &&
                          insertIndex === index;

                        return (
                          <div
                            key={post.id}
                            data-pipeline-card
                            className={cn(
                              "pp-kanban-card-slot",
                              shiftsAbove && "pp-kanban-card-slot--shift-above",
                              shiftsBelow && "pp-kanban-card-slot--shift-below",
                              showsGapMarker && "pp-kanban-card-slot--gap-marker",
                            )}
                            onDragOver={(event) =>
                              handleDragOverColumn(
                                event,
                                column.status,
                                acceptsDrop,
                              )
                            }
                            onDrop={(event) => {
                              const payload = parseDropPayload(event);
                              if (payload) {
                                void handleDrop(column.status, payload);
                              }
                            }}
                          >
                            <PipelineCard
                              post={post}
                              draggable={
                                isDraggable && transitioningPostId !== post.id
                              }
                              isDragging={dragging?.postId === post.id}
                              onDragStart={(payload) => setDragging(payload)}
                              onDragEnd={endDrag}
                            />
                          </div>
                        );
                      })}
                      {isDropTarget && insertIndex === column.posts.length ? (
                        <div
                          className="pp-kanban-drop-slot-end pp-kanban-drop-slot-end--active"
                          aria-hidden
                        />
                      ) : null}
                      {column.posts.length === 0 ? (
                        <div
                          className={cn(
                            "py-8 text-center text-xs transition-colors",
                            isDropTarget
                              ? "rounded-xl border-2 border-dashed border-[#4f46e5]/40 bg-[#eef2ff]/60 text-[#4f46e5]"
                              : "text-[#cbd2e0]",
                          )}
                          onDragOver={(event) =>
                            handleDragOverColumn(
                              event,
                              column.status,
                              acceptsDrop,
                            )
                          }
                          onDrop={(event) => {
                            const payload = parseDropPayload(event);
                            if (payload) {
                              void handleDrop(column.status, payload);
                            }
                          }}
                        >
                          {isDropTarget ? "Drop here" : "Empty"}
                        </div>
                      ) : null}
                      {columnHasMore(column) ? (
                        <p className="px-1 py-1 text-center text-[10.5px] text-[#94a3b8]">
                          +{columnOverflowCount(column)} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </QueryState>
    </div>
  );
}
