"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthError } from "@/components/auth/auth-ui";
import {
  OTP_LENGTH,
  OtpDigitInputs,
} from "@/components/auth/otp-digit-inputs";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { clerkErrorMessage } from "@/lib/auth/clerk";
import { syncCurrentUser } from "@/lib/auth/finish-session";
import { DASHBOARD_ROUTE } from "@/lib/auth/routes";
import { trackSignUpComplete } from "@/lib/analytics/events";

export function VerifyEmailForm() {
  const { getToken } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("pp_verify_email") ?? "your email");
  }, []);

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        sessionStorage.removeItem("pp_verify_email");

        try {
          await syncCurrentUser(getToken, queryClient);
        } catch {
          setError(
            "Account verified, but could not load your profile. Please sign in again.",
          );
          return;
        }

        trackSignUpComplete("email");
        router.replace(DASHBOARD_ROUTE);
        return;
      }
      setError("Verification incomplete. Please try again.");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signUp) return;
    setError(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setError(clerkErrorMessage(err));
    }
  };

  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-[#eef2ff]">
        <MsIcon name="mark_email_unread" size={30} className="text-[#4f46e5]" />
      </div>
      <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
        Verify your email
      </h1>
      <p className="mx-auto mt-2 mb-[26px] max-w-[340px] text-[14.5px] leading-[1.55] text-[#64748b]">
        We sent a 6-digit code to{" "}
        <strong className="text-[#1e293b]">{email}</strong>. Enter it below to
        continue.
      </p>

      <AuthError message={error} />

      <OtpDigitInputs
        digits={digits}
        onChange={setDigits}
        disabled={loading || !isLoaded}
      />

      <Button
        type="button"
        variant="primary"
        size="auth"
        fullWidth
        className="mb-[18px]"
        onClick={handleVerify}
        disabled={loading || !isLoaded}
      >
        {loading ? "Verifying…" : "Verify & continue"}
      </Button>

      <p className="mb-1.5 text-[13.5px] text-[#64748b]">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          className="font-semibold text-[#4f46e5] hover:text-[#4338ca]"
        >
          Resend
        </button>
      </p>
      <p className="text-[13.5px]">
        <Link href="/sign-up" className="font-semibold text-[#64748b] hover:text-[#475569]">
          ← Back
        </Link>
      </p>
    </div>
  );
}
