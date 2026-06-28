"use client";

import type { ReactNode } from "react";
import { ApiErrorBanner } from "@/components/app/api-error-banner";
import { toQueryError } from "@/lib/query-error-utils";

type QueryStateProps = {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  skeleton?: ReactNode;
  empty?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
};

export function QueryState({
  isLoading,
  error,
  isEmpty = false,
  skeleton,
  empty,
  onRetry,
  children,
}: QueryStateProps) {
  const queryError = toQueryError(error);

  if (isLoading) {
    return (
      <>
        {skeleton ?? (
          <div className="h-10 animate-pulse rounded-[10px] bg-[#eceef4]" />
        )}
      </>
    );
  }

  if (queryError) {
    return <ApiErrorBanner error={queryError} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <>
        {empty ?? (
          <p className="text-[12.5px] text-[#64748b]">Nothing to show yet.</p>
        )}
      </>
    );
  }

  return <>{children}</>;
}
