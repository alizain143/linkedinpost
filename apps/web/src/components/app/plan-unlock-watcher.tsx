"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/api/use-auth-api";
import { useBillingStatus } from "@/hooks/api/use-billing-api";
import {
  newlyUnlockedFeatures,
  PLAN_FEATURE_COPY,
  unlockTourIdForPlan,
  type PlanFeature,
} from "@/lib/plan-features";
import type { UserPlan } from "@/lib/api/types/enums";
import { useTour } from "@/providers/tour-provider";

function PlanUnlockModal({
  plan,
  features,
  onDismiss,
  onShowTour,
}: {
  plan: UserPlan;
  features: PlanFeature[];
  onDismiss: () => void;
  onShowTour: (() => void) | null;
}) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-unlock-title"
        className="w-full max-w-md rounded-2xl border border-[#eceef4] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
            <MsIcon name="celebration" size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="plan-unlock-title"
              className="font-display text-xl font-bold text-[#0f172a]"
            >
              {planLabel} features unlocked
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Here’s what’s new on your plan.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {features.map((feature) => {
            const copy = PLAN_FEATURE_COPY[feature];
            return (
              <li
                key={feature}
                className="rounded-xl border border-[#eceef4] bg-[#f8fafc] px-4 py-3"
              >
                <div className="text-sm font-semibold text-[#1e293b]">
                  {copy.title}
                </div>
                <p className="mt-0.5 text-sm text-[#64748b]">
                  {copy.description}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          {onShowTour ? (
            <Button
              type="button"
              variant="primary"
              className="flex-1 rounded-xl"
              onClick={onShowTour}
            >
              Show me
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-xl"
            onClick={onDismiss}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Detects plan feature unlocks vs lastAcknowledgedPlan and shows a modal + optional tour.
 */
export function PlanUnlockWatcher() {
  const { data: user } = useCurrentUser();
  const { data: billing } = useBillingStatus();
  const updateUser = useUpdateCurrentUser();
  const { startTour } = useTour();
  const [open, setOpen] = useState(false);
  const [pendingFeatures, setPendingFeatures] = useState<PlanFeature[]>([]);
  const handledRef = useRef<string | null>(null);

  const currentPlan = (billing?.plan ?? user?.plan ?? "free") as UserPlan;

  const unlocked = useMemo(() => {
    if (!user) return [];
    return newlyUnlockedFeatures(user.lastAcknowledgedPlan, currentPlan);
  }, [user, user?.lastAcknowledgedPlan, currentPlan]);

  useEffect(() => {
    if (!user) return;
    if (unlocked.length === 0) return;

    const key = `${user.lastAcknowledgedPlan ?? "none"}->${currentPlan}:${unlocked.join(",")}`;
    if (handledRef.current === key) return;
    handledRef.current = key;
    setPendingFeatures(unlocked);
    setOpen(true);
  }, [user, unlocked, currentPlan, user?.lastAcknowledgedPlan]);

  useEffect(() => {
    if (!user) return;
    if (user.lastAcknowledgedPlan === currentPlan) return;
    if (unlocked.length > 0) return;

    const key = `credits:${user.lastAcknowledgedPlan ?? "none"}->${currentPlan}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    void updateUser
      .mutateAsync({ lastAcknowledgedPlan: currentPlan })
      .catch(() => {
        handledRef.current = null;
      });
  }, [
    user,
    user?.lastAcknowledgedPlan,
    currentPlan,
    unlocked.length,
    updateUser,
  ]);

  const acknowledge = async () => {
    setOpen(false);
    try {
      await updateUser.mutateAsync({ lastAcknowledgedPlan: currentPlan });
    } catch {
      handledRef.current = null;
    }
  };

  const handleShowTour = async () => {
    const tourId = unlockTourIdForPlan(currentPlan);
    setOpen(false);
    try {
      await updateUser.mutateAsync({ lastAcknowledgedPlan: currentPlan });
    } catch {
      // still try to show tour
    }
    if (tourId) {
      window.setTimeout(() => startTour(tourId), 300);
    }
  };

  if (!open || pendingFeatures.length === 0) return null;

  const tourId = unlockTourIdForPlan(currentPlan);

  return (
    <PlanUnlockModal
      plan={currentPlan}
      features={pendingFeatures}
      onDismiss={() => void acknowledge()}
      onShowTour={tourId ? () => void handleShowTour() : null}
    />
  );
}
