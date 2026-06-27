"use client";

import { useEffect, useState } from "react";
import { isAppleSignInPlatform } from "@/lib/auth/apple-sign-in";

export function useAppleSignInAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(
      isAppleSignInPlatform(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints,
      ),
    );
  }, []);

  return available;
}
