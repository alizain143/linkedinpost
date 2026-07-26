"use client";

import { Button } from "@/components/ui/button";
import { useBillingTransactions } from "@/hooks/api/use-billing-api";
import type { ApiBillingTransaction } from "@/lib/api/types/billing";
import { formatResetDate } from "@/lib/format-relative-time";

function formatUsdFromCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function statusLabel(status: ApiBillingTransaction["status"]): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function statusClass(status: ApiBillingTransaction["status"]): string {
  switch (status) {
    case "paid":
      return "text-[#15803d] bg-[#f0fdf4]";
    case "refunded":
      return "text-[#a16207] bg-[#fffbeb]";
    case "failed":
      return "text-[#dc2626] bg-[#fef2f2]";
    default:
      return "text-[#64748b] bg-[#f8fafc]";
  }
}

export function BillingTransactionHistory() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useBillingTransactions();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
      <h3 className="font-display text-lg font-bold">Transaction history</h3>
      <p className="mt-1 text-sm text-[#64748b]">
        Subscription charges and credit purchases.
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-[#eceef4]"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="mt-4 text-sm text-[#dc2626]">
          Could not load transactions.{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <p className="mt-4 text-sm text-[#94a3b8]">No billing activity yet.</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-4 divide-y divide-[#f1f3f8]">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3"
            >
              <div>
                <div className="text-sm font-semibold text-[#0f172a]">
                  {row.description ?? "Billing event"}
                </div>
                <div className="mt-0.5 text-xs text-[#94a3b8]">
                  {formatResetDate(row.occurredAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[#0f172a]">
                  {formatUsdFromCents(row.amountCents, row.currency)}
                </div>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(row.status)}`}
                >
                  {statusLabel(row.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {hasNextPage ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="rounded-[10px]"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
