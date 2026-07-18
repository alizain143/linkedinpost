import type { UserPlan } from "@/lib/api/types/enums";
import type { LinkedInConnectionState } from "@/lib/linkedin-utils";

export type TourRuntimeContext = {
  linkedInState: LinkedInConnectionState;
  hasContentProfile: boolean;
  plan: UserPlan;
  needsLinkedInImport: boolean;
};

export type TourStep = {
  /** CSS selector for spotlight target; omit for centered modal step */
  element?: string;
  /** Navigate here before highlighting */
  route?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  /** Skip step when false */
  when?: (ctx: TourRuntimeContext) => boolean;
  /** Label for the Next button */
  nextBtnText?: string;
};

export type TourDefinition = {
  id: string;
  steps: TourStep[];
};

export const PRODUCT_CORE_TOUR_ID = "product-core-v1";
export const PRO_UNLOCK_TOUR_ID = "pro-unlock-v1";
export const AGENCY_UNLOCK_TOUR_ID = "agency-unlock-v1";

/** @deprecated use PRODUCT_CORE_TOUR_ID */
export const APP_BASICS_TOUR_ID = PRODUCT_CORE_TOUR_ID;

const isDisconnected = (ctx: TourRuntimeContext) =>
  ctx.linkedInState === "disconnected" ||
  ctx.linkedInState === "needsPublishScope";

const isPublishReady = (ctx: TourRuntimeContext) =>
  ctx.linkedInState === "publishReady";

const isProOrAgency = (ctx: TourRuntimeContext) =>
  ctx.plan === "pro" || ctx.plan === "agency";

const isAgency = (ctx: TourRuntimeContext) => ctx.plan === "agency";

/**
 * Show-only walkthrough: spotlight real UI, narrate the workflow.
 * App interactions are locked while the tour runs — Next/Back/Close only.
 */
export const PRODUCT_CORE_TOUR: TourDefinition = {
  id: PRODUCT_CORE_TOUR_ID,
  steps: [
    // ── Act 1: Voice ──────────────────────────────────────────────
    {
      route: "/app/profile",
      element: '.pp-sidebar [data-tour="nav-profile"]',
      title: "Your content voice",
      description:
        "Start with Profile — every draft inherits this workspace’s voice, audience, and pillars.",
      side: "right",
    },
    {
      route: "/app/profile",
      element: '[data-tour="profile-ai-wizard"]',
      title: "Generate with AI",
      description:
        "Fastest way to bootstrap a profile. Approving AI suggestions costs 1 credit each.",
      side: "bottom",
    },
    {
      route: "/app/profile",
      element: '[data-tour="profile-form"]',
      title: "Edit your voice",
      description:
        "Tone, pillars, and writing sample steer Quick Draft and AI Council. Keep one default.",
      side: "left",
      when: (ctx) => ctx.hasContentProfile,
    },
    {
      route: "/app/profile",
      element: '[data-tour="profile-save"]',
      title: "Save the profile",
      description:
        "Saved profiles power generation. Generate picks the default automatically.",
      side: "top",
      when: (ctx) => ctx.hasContentProfile,
    },

    // ── Act 2: LinkedIn ───────────────────────────────────────────
    {
      route: "/app/settings",
      element: '.pp-sidebar [data-tour="nav-settings"]',
      title: "Publishing setup",
      description:
        "Settings holds LinkedIn. You can draft without it; Schedule and Publish need a connection.",
      side: "right",
    },
    {
      route: "/app/settings",
      element: '[data-tour="settings-linkedin-connect"]',
      title: "Connect LinkedIn",
      description:
        "Connect once so posts can schedule and publish as you.",
      side: "bottom",
      when: isDisconnected,
    },
    {
      route: "/app/settings",
      element: '[data-tour="settings-linkedin-import"]',
      title: "Import LinkedIn",
      description:
        "Import headline and About for a stronger AI voice match.",
      side: "bottom",
      when: (ctx) => isPublishReady(ctx) && ctx.needsLinkedInImport,
    },

    // ── Act 3: Create ─────────────────────────────────────────────
    {
      route: "/app/dashboard",
      element: '[data-tour="dashboard-generate"]',
      title: "Generate a post",
      description:
        "Fastest path from idea to draft — opens Generate with your profile loaded.",
      side: "bottom",
    },
    {
      route: "/app/generate",
      element: '[data-tour="generate-mode-quick"]',
      title: "Quick Draft — 1 credit",
      description:
        "Fast text variants when you want options now.",
      side: "bottom",
    },
    {
      route: "/app/generate",
      element: '[data-tour="generate-topic"]',
      title: "Pick a topic",
      description:
        "Topic is the main quality lever. Be specific: outcome + audience beats vague themes.",
      side: "bottom",
    },
    {
      route: "/app/generate",
      element: '[data-tour="generate-suggest-topics"]',
      title: "Suggest topics",
      description:
        "Stuck? AI suggests ideas from your profile and LinkedIn context.",
      side: "left",
    },
    {
      route: "/app/generate",
      element: '[data-tour="generate-mode-council"]',
      title: "AI Council — 3 credits",
      description:
        "Deeper review plus a media path for posts that matter.",
      side: "bottom",
    },
    {
      route: "/app/generate",
      element: '[data-tour="generate-submit"]',
      title: "Run generation",
      description:
        "Credits deduct on success. Then edit, approve, schedule, or publish.",
      side: "top",
    },

    // ── Act 4: Review & ship ──────────────────────────────────────
    {
      route: "/app/pipeline",
      element: '.pp-sidebar [data-tour="nav-pipeline"]',
      title: "Pipeline",
      description:
        "Drafts move ready → approved here before they go live.",
      side: "right",
    },
    {
      route: "/app/pipeline",
      element: '[data-tour="pipeline-board"]',
      title: "Status board",
      description:
        "Your content factory floor — open a card or drag between stages.",
      side: "top",
    },
    {
      route: "/app/approvals",
      element: '.pp-sidebar [data-tour="nav-approvals"]',
      title: "Approvals",
      description:
        "Decide approve, request changes, or reject before publishing.",
      side: "right",
    },
    {
      route: "/app/calendar",
      element: '.pp-sidebar [data-tour="nav-calendar"]',
      title: "Calendar",
      description:
        "See what’s scheduled across the month.",
      side: "right",
    },
    {
      route: "/app/billing",
      element: '.pp-sidebar [data-tour="nav-billing"]',
      title: "Credits & plans",
      description:
        "Generation spends credits. Upgrade when Free runs out.",
      side: "right",
    },
    {
      route: "/app/billing",
      element: '[data-tour="billing-summary"]',
      title: "You’re set",
      description:
        "Loop: voice → draft → review → schedule. Replay anytime from Settings.",
      side: "bottom",
      nextBtnText: "Done",
    },

    // ── Act 5: Scale ──────────────────────────────────────────────
    {
      route: "/app/autopilot",
      element: '[data-tour="autopilot-toggle"]',
      title: "Autopilot (Pro)",
      description:
        "Set a cadence and let drafts appear on a schedule.",
      side: "bottom",
      when: isProOrAgency,
    },
    {
      route: "/app/clients",
      element: '[data-tour="clients-add"]',
      title: "Clients (Agency)",
      description:
        "Add client workspaces and run LinkedIn for more than one brand.",
      side: "bottom",
      when: isAgency,
    },
  ],
};

export const PRO_UNLOCK_TOUR: TourDefinition = {
  id: PRO_UNLOCK_TOUR_ID,
  steps: [
    {
      route: "/app/autopilot",
      element: '[data-tour="autopilot-toggle"]',
      title: "Autopilot is unlocked",
      description:
        "Turn on a posting cadence — drafts queue for approval or auto-schedule when LinkedIn is ready.",
      side: "bottom",
    },
    {
      route: "/app/generate/calendar",
      element: '[data-tour="calgen-submit"]',
      title: "30-day calendars",
      description:
        "Generate a full month of post ideas in one run from calendar mode.",
      side: "top",
    },
  ],
};

export const AGENCY_UNLOCK_TOUR: TourDefinition = {
  id: AGENCY_UNLOCK_TOUR_ID,
  steps: [
    {
      route: "/app/clients",
      element: '[data-tour="clients-add"]',
      title: "Client workspaces",
      description:
        "Add client workspaces and connect each LinkedIn account separately.",
      side: "bottom",
    },
    {
      route: "/app/approvals",
      element: '[data-tour="approvals-approve"]',
      title: "Client approvals",
      description:
        "Share review links so clients can approve posts without logging in.",
      side: "top",
    },
  ],
};

export const APP_BASICS_TOUR: TourDefinition = PRODUCT_CORE_TOUR;

export const TOUR_REGISTRY: Record<string, TourDefinition> = {
  [PRODUCT_CORE_TOUR_ID]: PRODUCT_CORE_TOUR,
  [PRO_UNLOCK_TOUR_ID]: PRO_UNLOCK_TOUR,
  [AGENCY_UNLOCK_TOUR_ID]: AGENCY_UNLOCK_TOUR,
};

export function getTourById(id: string): TourDefinition | null {
  return TOUR_REGISTRY[id] ?? null;
}

export function buildTourSteps(
  tourId: string,
  ctx: TourRuntimeContext,
): TourStep[] {
  const tour = getTourById(tourId);
  if (!tour) return [];
  return tour.steps.filter((step) => (step.when ? step.when(ctx) : true));
}
