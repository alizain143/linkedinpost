import {
  LINKEDIN_IMPORT_REVIEW_PARAM,
  LINKEDIN_IMPORT_SESSION_KEY,
  LINKEDIN_IMPORT_EXPECTED_SLUG_KEY,
  type ImportLinkedInProfileInput,
} from "@/lib/api/types/linkedin";

export const LINKEDIN_STAGED_IMPORT_READY_EVENT =
  "linkedinpost-staged-import-ready";

const WEB_SOURCE = "linkedinpost-web";
const EXT_SOURCE = "linkedinpost-extension";

export type LinkedInImportPreview = {
  profileUrl?: string | null;
  headline?: string | null;
  summary?: string | null;
  positions?: Array<{
    title?: string | null;
    companyName?: string | null;
    description?: string | null;
    isCurrent?: boolean;
  }>;
  education?: Array<{
    schoolName?: string | null;
    degreeName?: string | null;
  }>;
  skills?: string[];
};

export type LinkedInImportPreviewEvent = {
  preview: LinkedInImportPreview;
};

export function pingLinkedInExtension(timeoutMs = 900): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(false);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.source !== EXT_SOURCE || event.data?.type !== "LP_PONG") {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(event.data.ok !== false);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ source: WEB_SOURCE, type: "LP_PING" }, "*");
  });
}

export function buildImportReturnUrl(): string {
  if (typeof window === "undefined") {
    return "/app/settings";
  }
  const url = new URL("/app/settings", window.location.origin);
  url.searchParams.set(LINKEDIN_IMPORT_REVIEW_PARAM, "1");
  return url.toString();
}

export function startLinkedInImportSession(input: {
  importToken: string;
  workspaceId: string;
  apiBase: string;
  linkedInUrl: string;
  returnUrl: string;
  expectedProfileSlug: string;
  profileName?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "Extension did not respond" });
    }, 5000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (
        event.data?.source !== EXT_SOURCE ||
        event.data?.type !== "LP_IMPORT_STARTED"
      ) {
        return;
      }
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({ ok: Boolean(event.data.ok), error: event.data.error });
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      {
        source: WEB_SOURCE,
        type: "LP_START_IMPORT",
        payload: input,
      },
      "*",
    );
  });
}

export function subscribeLinkedInImportPreview(
  handler: (event: LinkedInImportPreviewEvent) => void,
): () => void {
  function onMessage(event: MessageEvent) {
    if (event.source !== window) return;
    if (
      event.data?.source !== EXT_SOURCE ||
      event.data?.type !== "LP_IMPORT_PREVIEW"
    ) {
      return;
    }
    handler({
      preview: event.data.preview as LinkedInImportPreview,
    });
  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function subscribeLinkedInImportExtractError(
  handler: (event: { error: string }) => void,
): () => void {
  function onMessage(event: MessageEvent) {
    if (event.source !== window) return;
    if (
      event.data?.source !== EXT_SOURCE ||
      event.data?.type !== "LP_IMPORT_EXTRACT_ERROR"
    ) {
      return;
    }
    handler({ error: String(event.data.error ?? "Profile extraction failed") });
  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function readStagedImportFromSession(): LinkedInImportPreview | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LINKEDIN_IMPORT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LinkedInImportPreview;
  } catch {
    return null;
  }
}

export function stageImportPreview(preview: LinkedInImportPreview): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LINKEDIN_IMPORT_SESSION_KEY, JSON.stringify(preview));
}

export function clearStagedImportSession(): void {
  sessionStorage.removeItem(LINKEDIN_IMPORT_SESSION_KEY);
  sessionStorage.removeItem(LINKEDIN_IMPORT_EXPECTED_SLUG_KEY);
}

export function setImportExpectedSlug(slug: string | null): void {
  if (typeof window === "undefined") return;
  if (!slug) {
    sessionStorage.removeItem(LINKEDIN_IMPORT_EXPECTED_SLUG_KEY);
    return;
  }
  sessionStorage.setItem(LINKEDIN_IMPORT_EXPECTED_SLUG_KEY, slug.toLowerCase());
}

export function readImportExpectedSlug(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(LINKEDIN_IMPORT_EXPECTED_SLUG_KEY);
}

export function stagedImportToPayload(
  preview: LinkedInImportPreview,
): ImportLinkedInProfileInput {
  return {
    profileUrl: preview.profileUrl ?? "",
    headline: preview.headline ?? null,
    summary: preview.summary ?? null,
    positions: preview.positions?.map(
      (p: NonNullable<LinkedInImportPreview["positions"]>[number]) => ({
      title: p.title ?? null,
      companyName: p.companyName ?? null,
      companyPageUrl: null,
      startedOn: null,
      isCurrent: p.isCurrent ?? false,
    })),
    education: preview.education?.map(
      (e: NonNullable<LinkedInImportPreview["education"]>[number]) => ({
      schoolName: e.schoolName ?? null,
      degreeName: e.degreeName ?? null,
      fieldOfStudy: null,
    })),
  };
}
