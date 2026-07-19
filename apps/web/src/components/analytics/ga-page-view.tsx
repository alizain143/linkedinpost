"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/ids";

function GaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.gtag?.("config", GA_MEASUREMENT_ID, { page_path: pagePath });
  }, [pathname, searchParams]);

  return null;
}

export function GaPageView() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Suspense fallback={null}>
      <GaPageViewTracker />
    </Suspense>
  );
}
