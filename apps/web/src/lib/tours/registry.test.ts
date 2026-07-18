import { describe, expect, it } from "vitest";
import {
  buildTourSteps,
  PRODUCT_CORE_TOUR_ID,
  type TourRuntimeContext,
} from "@/lib/tours/registry";

const base: TourRuntimeContext = {
  linkedInState: "disconnected",
  hasContentProfile: false,
  plan: "free",
  needsLinkedInImport: false,
};

describe("buildTourSteps product-core-v1", () => {
  it("starts on Profile then Generate with AI (show-only)", () => {
    const steps = buildTourSteps(PRODUCT_CORE_TOUR_ID, base);
    expect(steps[0]?.element).toContain("nav-profile");
    expect(steps[1]?.element).toContain("profile-ai-wizard");
    expect(steps.every((s) => !("action" in s && s.action))).toBe(true);
  });

  it("includes LinkedIn connect when disconnected", () => {
    const steps = buildTourSteps(PRODUCT_CORE_TOUR_ID, base);
    expect(
      steps.some((s) => s.element?.includes("settings-linkedin-connect")),
    ).toBe(true);
  });

  it("shows profile form when a profile exists and skips connect when ready", () => {
    const steps = buildTourSteps(PRODUCT_CORE_TOUR_ID, {
      ...base,
      linkedInState: "publishReady",
      hasContentProfile: true,
      needsLinkedInImport: false,
    });
    expect(steps.some((s) => s.element?.includes("profile-form"))).toBe(true);
    expect(
      steps.some((s) => s.element?.includes("settings-linkedin-connect")),
    ).toBe(false);
  });

  it("includes Pro chapters for pro plan", () => {
    const steps = buildTourSteps(PRODUCT_CORE_TOUR_ID, {
      ...base,
      linkedInState: "publishReady",
      hasContentProfile: true,
      plan: "pro",
    });
    expect(steps.some((s) => s.element?.includes("autopilot-toggle"))).toBe(
      true,
    );
    expect(steps.some((s) => s.element?.includes("clients-add"))).toBe(false);
  });

  it("includes Agency clients step", () => {
    const steps = buildTourSteps(PRODUCT_CORE_TOUR_ID, {
      ...base,
      linkedInState: "publishReady",
      hasContentProfile: true,
      plan: "agency",
    });
    expect(steps.some((s) => s.element?.includes("clients-add"))).toBe(true);
  });
});
