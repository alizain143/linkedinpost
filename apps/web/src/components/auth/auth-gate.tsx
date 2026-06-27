"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const bypass = isAuthBypassEnabled();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (bypass) return;
    if (isLoaded && isSignedIn) {
      router.replace("/app/dashboard");
    }
  }, [bypass, isLoaded, isSignedIn, router]);

  if (bypass) {
    return children;
  }

  if (!isLoaded || isSignedIn) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
      </div>
    );
  }

  return children;
}
