"use client";

import { useAppBack } from "@/hooks/use-app-back";
import { cn } from "@/lib/utils";
import { MsIcon } from "@/components/ui/ms-icon";

type BackLinkProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export function BackLink({
  fallbackHref,
  label = "Back",
  className,
}: BackLinkProps) {
  const goBack = useAppBack(fallbackHref);

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "mb-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5]",
        className,
      )}
    >
      <MsIcon name="arrow_back" size={16} />
      {label}
    </button>
  );
}
