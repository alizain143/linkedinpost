"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function GaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!GA_ID || process.env.NODE_ENV !== "production") return;

    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.gtag?.("config", GA_ID, { page_path: pagePath });
  }, [pathname, searchParams]);

  return null;
}

export function GaPageView() {
  if (process.env.NODE_ENV !== "production" || !GA_ID) return null;

  return (
    <Suspense fallback={null}>
      <GaPageViewTracker />
    </Suspense>
  );
}
