"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useCreditCheckoutMutation,
  useCreditQuote,
} from "@/hooks/api/use-billing-api";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { useAppUi } from "@/providers/app-ui-provider";

const MIN = 25;
const MAX = 2000;

function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function BillingBuyCredits() {
  const { showToast } = useAppUi();
  const [creditsInput, setCreditsInput] = useState("50");
  const [debouncedCredits, setDebouncedCredits] = useState(50);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const parsed = Number.parseInt(creditsInput, 10);
      if (Number.isInteger(parsed)) {
        setDebouncedCredits(parsed);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [creditsInput]);

  const credits = Number.parseInt(creditsInput, 10);
  const creditsValid =
    Number.isInteger(credits) && credits >= MIN && credits <= MAX;

  const quoteQuery = useCreditQuote(
    creditsValid ? debouncedCredits : null,
    creditsValid,
  );
  const checkoutMutation = useCreditCheckoutMutation();

  const handleBuy = () => {
    if (!creditsValid) {
      showToast(`Enter between ${MIN} and ${MAX} credits`, "error");
      return;
    }

    checkoutMutation.mutate(
      { credits },
      {
        onError: (error) => {
          showToast(getApiErrorMessage(error), "error");
        },
      },
    );
  };

  return (
    <div
      id="buy-credits"
      className="scroll-mt-24 rounded-2xl border border-[#eceef4] bg-white p-5"
    >
      <h3 className="font-display text-lg font-bold">Buy credits</h3>
      <p className="mt-1 text-sm text-[#64748b]">
        Top up anytime. Larger amounts unlock a lower price per credit.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1">
          <label
            htmlFor="credit-topup-amount"
            className="text-sm font-semibold text-[#64748b]"
          >
            Credits
          </label>
          <Input
            id="credit-topup-amount"
            type="number"
            min={MIN}
            max={MAX}
            step={1}
            value={creditsInput}
            onChange={(event) => setCreditsInput(event.target.value)}
            className="mt-2"
          />
          <p className="mt-1 text-xs text-[#94a3b8]">
            Min {MIN} · Max {MAX}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          className="rounded-[10px]"
          disabled={!creditsValid || checkoutMutation.isPending}
          onClick={handleBuy}
        >
          <MsIcon name="shopping_cart" size={18} />
          {checkoutMutation.isPending ? "Redirecting…" : "Buy credits"}
        </Button>
      </div>

      {creditsValid && quoteQuery.data ? (
        <div className="mt-4 rounded-xl bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
          <div className="flex flex-wrap justify-between gap-2">
            <span>
              {formatUsdFromCents(quoteQuery.data.unitPriceCents)} / credit
              {quoteQuery.data.discountPercent > 0
                ? ` · ${quoteQuery.data.discountPercent}% off list`
                : null}
            </span>
            <span className="font-semibold text-[#0f172a]">
              Total {formatUsdFromCents(quoteQuery.data.totalCents)}
            </span>
          </div>
        </div>
      ) : null}

      {quoteQuery.isError ? (
        <p className="mt-2 text-xs font-medium text-[#dc2626]">
          {quoteQuery.error instanceof ApiError
            ? getApiErrorMessage(quoteQuery.error)
            : "Could not load quote"}
        </p>
      ) : null}
    </div>
  );
}
