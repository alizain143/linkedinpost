import type { QuickDraftVariant } from "@/lib/api/types/generation";

const STORAGE_KEY = "pp-generation-sessions";
const MAX_HISTORY = 8;

export type StoredQuickDraftSession = {
  variants: QuickDraftVariant[];
  savedPostIds: Record<number, string>;
  dismissedVariantIndices: number[];
  topic: string;
  contentProfileId: string;
  postType: string;
  tone: string;
  pillar: string;
  createdAt: string;
};

export type GenerationHistoryEntry = {
  id: string;
  kind: "quick_draft" | "council" | "calendar";
  label: string;
  topic: string;
  createdAt: string;
  variantCount?: number;
  councilJobId?: string;
  councilPostId?: string;
  calendarJobId?: string;
  calendarSlotCount?: number;
  quickDraftSnapshot?: StoredQuickDraftSession;
};

export type WorkspaceGenerationSession = {
  quickDraft: StoredQuickDraftSession | null;
  activeCouncilJobId: string | null;
  activeCalendarJobId: string | null;
  mode: "quick" | "council" | "media";
  history: GenerationHistoryEntry[];
};

type SessionStore = Record<string, WorkspaceGenerationSession>;

function emptySession(): WorkspaceGenerationSession {
  return {
    quickDraft: null,
    activeCouncilJobId: null,
    activeCalendarJobId: null,
    mode: "quick",
    history: [],
  };
}

function readStore(): SessionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SessionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SessionStore): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function loadGenerationSession(
  workspaceId: string | null | undefined,
): WorkspaceGenerationSession {
  if (!workspaceId) return emptySession();
  return readStore()[workspaceId] ?? emptySession();
}

export function saveGenerationSession(
  workspaceId: string,
  patch: Partial<WorkspaceGenerationSession>,
): WorkspaceGenerationSession {
  const store = readStore();
  const current = store[workspaceId] ?? emptySession();
  const next = { ...current, ...patch };
  store[workspaceId] = next;
  writeStore(store);
  return next;
}

export function addGenerationHistoryEntry(
  workspaceId: string,
  entry: Omit<GenerationHistoryEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): GenerationHistoryEntry {
  const store = readStore();
  const current = store[workspaceId] ?? emptySession();
  const full: GenerationHistoryEntry = {
    id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    kind: entry.kind,
    label: entry.label,
    topic: entry.topic,
    variantCount: entry.variantCount,
    councilJobId: entry.councilJobId,
    councilPostId: entry.councilPostId,
    calendarJobId: entry.calendarJobId,
    calendarSlotCount: entry.calendarSlotCount,
    quickDraftSnapshot: entry.quickDraftSnapshot,
  };
  const history = [full, ...current.history].slice(0, MAX_HISTORY);
  const next = { ...current, history };
  store[workspaceId] = next;
  writeStore(store);
  return full;
}

export function buildCalendarHighlightUrl(
  slots: Array<{ scheduledAt: string }>,
): string {
  const dates = [
    ...new Set(slots.map((slot) => slot.scheduledAt.slice(0, 10))),
  ].sort();
  const params = new URLSearchParams();
  params.set("filter", "Needs Approval");
  if (dates.length > 0) {
    params.set("highlight", dates.join(","));
    params.set("date", dates[0]);
  }
  return `/app/calendar?${params.toString()}`;
}
