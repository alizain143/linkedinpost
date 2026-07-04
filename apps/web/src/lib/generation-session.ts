import type { QuickDraftVariant, TopicSuggestion } from "@/lib/api/types/generation";

const STORAGE_KEY = "pp-generation-sessions";
const MAX_HISTORY = 8;
const STALE_SESSION_MS = 24 * 60 * 60 * 1000;

export type StoredQuickDraftSession = {
  variants: QuickDraftVariant[];
  originalVariants?: QuickDraftVariant[];
  savedPostIds: Record<number, string>;
  dismissedVariantIndices: number[];
  topic: string;
  contentProfileId: string;
  postType: string;
  tone: string;
  pillar: string;
  createdAt: string;
};

export type StoredTopicSuggestions = {
  suggestions: TopicSuggestion[];
  fingerprint: string;
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
  topicSuggestions: StoredTopicSuggestions | null;
  activeCouncilJobId: string | null;
  activeCalendarJobId: string | null;
  mode: "quick" | "council";
  history: GenerationHistoryEntry[];
  skipCreditConfirm?: boolean;
};

type SessionStore = Record<string, WorkspaceGenerationSession>;

function emptySession(): WorkspaceGenerationSession {
  return {
    quickDraft: null,
    topicSuggestions: null,
    activeCouncilJobId: null,
    activeCalendarJobId: null,
    mode: "quick",
    history: [],
    skipCreditConfirm: false,
  };
}

function readStore(): SessionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SessionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SessionStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore quota errors
    }
  }
}

export function loadGenerationSession(
  workspaceId: string | null | undefined,
): WorkspaceGenerationSession {
  if (!workspaceId) return emptySession();
  const session = readStore()[workspaceId] ?? emptySession();
  return {
    ...emptySession(),
    ...session,
    topicSuggestions: session.topicSuggestions ?? null,
  };
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
): { entry: GenerationHistoryEntry; created: boolean } {
  const store = readStore();
  const current = store[workspaceId] ?? emptySession();

  // Re-opening a completed job remounts Generate and re-fires onCompleted;
  // treat the same job id as the same history row.
  const existing = current.history.find((item) => {
    if (entry.id && item.id === entry.id) return true;
    if (entry.councilJobId && item.councilJobId === entry.councilJobId) {
      return true;
    }
    if (entry.calendarJobId && item.calendarJobId === entry.calendarJobId) {
      return true;
    }
    return false;
  });
  if (existing) {
    return { entry: existing, created: false };
  }

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
  return { entry: full, created: true };
}

export function buildTopicFingerprint(input: {
  contentProfileId: string;
  postType: string;
  tone: string;
  pillar: string;
  additionalContext: string;
}): string {
  return [
    input.contentProfileId,
    input.postType,
    input.tone,
    input.pillar,
    input.additionalContext.trim().toLowerCase(),
  ].join("|");
}

export function isQuickDraftSessionStale(
  session: StoredQuickDraftSession | null | undefined,
): boolean {
  if (!session?.createdAt) return false;
  const created = Date.parse(session.createdAt);
  if (Number.isNaN(created)) return false;
  return Date.now() - created > STALE_SESSION_MS;
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
