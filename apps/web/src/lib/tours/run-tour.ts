"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/lib/tours/tour.css";
import {
  buildTourSteps,
  getTourById,
  type TourDefinition,
  type TourRuntimeContext,
  type TourStep,
} from "@/lib/tours/registry";

export type RunTourOptions = {
  tourId: string;
  navigate: (route: string) => Promise<void> | void;
  context?: TourRuntimeContext;
  onComplete?: () => void;
  onDismiss?: () => void;
};

const TOUR_ACTIVE_ATTR = "data-pp-tour-active";

function setTourUiLocked(locked: boolean) {
  if (typeof document === "undefined") return;
  if (locked) {
    document.body.setAttribute(TOUR_ACTIVE_ATTR, "true");
  } else {
    document.body.removeAttribute(TOUR_ACTIVE_ATTR);
  }
}

function isElementVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function resolveTourElement(selector: string | undefined): Element | undefined {
  if (!selector || typeof document === "undefined") return undefined;
  const matches = Array.from(document.querySelectorAll(selector));
  const visible = matches.find(isElementVisible);
  if (visible) return visible;

  const bare = selector.replace(/^\.pp-sidebar\s+/, "");
  if (bare !== selector) {
    const fallback = Array.from(document.querySelectorAll(bare)).find(
      isElementVisible,
    );
    if (fallback) return fallback;
  }
  return matches[0];
}

async function waitForTourElement(
  selector: string | undefined,
  timeoutMs = 8000,
): Promise<Element | undefined> {
  if (!selector) return undefined;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const el = resolveTourElement(selector);
    if (el && isElementVisible(el)) return el;
    await new Promise((r) => setTimeout(r, 50));
  }
  return resolveTourElement(selector);
}

function toDriveStep(step: TourStep): DriveStep {
  return {
    element: step.element
      ? () => resolveTourElement(step.element) ?? document.body
      : undefined,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side ?? "right",
      align: "start",
      popoverClass: "pp-tour-popover",
      nextBtnText: step.nextBtnText ?? "Next",
    },
    // Show-only: spotlight is visible but not clickable
    disableActiveInteraction: true,
  };
}

async function navigateToRoute(
  route: string,
  navigate: RunTourOptions["navigate"],
) {
  if (typeof window === "undefined") return;
  if (
    window.location.pathname === route ||
    window.location.pathname.startsWith(`${route}/`)
  ) {
    return;
  }
  await navigate(route);
  const started = Date.now();
  while (Date.now() - started < 8000) {
    if (
      window.location.pathname === route ||
      window.location.pathname.startsWith(`${route}/`)
    ) {
      return;
    }
    await new Promise((r) => setTimeout(r, 40));
  }
}

async function prepareStep(
  step: TourStep | undefined,
  navigate: RunTourOptions["navigate"],
) {
  if (!step || typeof window === "undefined") return;
  if (step.route) {
    await navigateToRoute(step.route, navigate);
  }
  const el = await waitForTourElement(step.element, 8000);
  if (el instanceof HTMLElement) {
    // Instant scroll so the popover isn't positioned mid-smooth-scroll (that causes jumps)
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }
  // Two frames + short settle so layout is stable before driver positions
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((r) => setTimeout(r, 60));
}

export async function runProductTour({
  tourId,
  navigate,
  context,
  onComplete,
  onDismiss,
}: RunTourOptions): Promise<void> {
  const tour = getTourById(tourId);
  if (!tour) return;

  const defaultCtx: TourRuntimeContext = {
    linkedInState: "disconnected",
    hasContentProfile: false,
    plan: "free",
    needsLinkedInImport: false,
  };
  const steps = context
    ? buildTourSteps(tourId, context)
    : buildTourSteps(tourId, defaultCtx);

  if (steps.length === 0) return;

  let finished = false;
  let moving = false;

  setTourUiLocked(true);
  await prepareStep(steps[0], navigate);

  const d = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    // Driver's own smooth scroll fights our prepare scroll and jumps the popover
    smoothScroll: false,
    overlayColor: "#0f172a",
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: "pp-tour-popover",
    progressText: "{{current}} of {{total}}",
    doneBtnText: "Done",
    nextBtnText: "Next",
    prevBtnText: "Back",
    disableActiveInteraction: true,
    steps: steps.map(toDriveStep),
    onNextClick: async (_el, _step, { driver: drv }) => {
      if (moving) return;
      const index = drv.getActiveIndex() ?? 0;
      const isLast = index >= steps.length - 1;
      if (isLast) {
        finished = true;
        drv.destroy();
        return;
      }
      moving = true;
      try {
        await prepareStep(steps[index + 1], navigate);
        drv.moveNext();
      } finally {
        moving = false;
      }
    },
    onPrevClick: async (_el, _step, { driver: drv }) => {
      if (moving) return;
      const index = drv.getActiveIndex() ?? 0;
      if (index <= 0) return;
      moving = true;
      try {
        await prepareStep(steps[index - 1], navigate);
        drv.movePrevious();
      } finally {
        moving = false;
      }
    },
    onCloseClick: (_el, _step, { driver: drv }) => {
      drv.destroy();
    },
    onDestroyed: () => {
      setTourUiLocked(false);
      if (finished) {
        onComplete?.();
      } else {
        onDismiss?.();
      }
    },
  });

  d.drive();
}

export function hasSeenTour(
  toursSeen: Record<string, string> | undefined,
  tourId: string,
): boolean {
  return Boolean(toursSeen?.[tourId]);
}

export type { TourDefinition, TourRuntimeContext };
