"use client";

import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

function friendlyErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Your session expired. Please sign in again.";
      case "RESOURCE_NOT_FOUND":
        return "The requested resource was not found.";
      case "ACCOUNT_DELETED":
        return "This account has been deleted.";
      default:
        return error.message;
    }
  }

  return error.message || "Something went wrong.";
}

type ApiErrorBannerProps = {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
};

export function ApiErrorBanner({ error, onRetry, className }: ApiErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5",
        className,
      )}
      role="alert"
    >
      <MsIcon name="warning" size={18} className="shrink-0 text-[#dc2626]" />
      <p className="min-w-0 flex-1 text-[12.5px] font-medium text-[#991b1b]">
        {friendlyErrorMessage(error)}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="shrink-0 text-[#991b1b] hover:bg-[#fee2e2]"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}
