"use client";

import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/api/use-credits-api";
import { formatResetDate } from "@/lib/format-relative-time";

export function CreditsMeter() {
  const { balance, isLoading, error, refetch, usage } = useCredits();

  if (isLoading) {
    return (
      <div className="mb-3 h-[118px] animate-pulse rounded-[13px] bg-[#eceef4]" />
    );
  }

  if (error || !balance || !usage) {
    return (
      <div className="mb-3 rounded-[13px] border border-[#eceef4] bg-[#f8f9fc] p-[13px]">
        <p className="text-xs text-[#64748b]">Couldn&apos;t load credits.</p>
        <Button
          type="button"
          variant="muted"
          size="xs"
          className="mt-2"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const showUpgradeCta =
    balance.remaining === 0 || balance.plan === "free";

  return (
    <div className="mb-3 rounded-[13px] border border-[#e6e8ff] bg-gradient-to-br from-[#f6f5ff] to-[#eef2ff] p-[13px]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#4338ca]">Credits</span>
        <span className="font-display text-xs font-bold text-[#4338ca]">
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="mb-1.5 h-[7px] overflow-hidden rounded-full bg-[#e0e3ff]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]"
          style={{ width: `${usage.usagePercent}%` }}
        />
      </div>
      <p className="mb-[11px] text-[10.5px] text-[#64748b]">
        Resets {formatResetDate(balance.periodEnd)}
      </p>
      {showUpgradeCta ? (
        <Button
          href="/app/billing"
          variant="primary"
          size="xs"
          fullWidth
          className="py-2"
        >
          Upgrade plan
        </Button>
      ) : (
        <Button
          href="/app/billing"
          variant="muted"
          size="xs"
          fullWidth
          className="py-2"
        >
          View billing
        </Button>
      )}
    </div>
  );
}
