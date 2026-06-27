"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RESET_EMAIL_KEY } from "@/components/auth/forgot-password-form";
import {
  AuthError,
  AuthField,
  AuthHeading,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { clerkErrorMessage } from "@/lib/auth/clerk";
import { syncCurrentUser } from "@/lib/auth/finish-session";
import { DASHBOARD_ROUTE } from "@/lib/auth/routes";

const OTP_LENGTH = 6;

export function ResetPasswordForm() {
  const { getToken } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESET_EMAIL_KEY);
    if (!stored) {
      router.replace("/sign-in/forgot-password");
      return;
    }
    setEmail(stored);
  }, [router]);

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
      });

      if (attempt.status !== "needs_new_password") {
        setError("Could not verify the reset code. Please try again.");
        return;
      }

      const result = await signIn.resetPassword({ password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        sessionStorage.removeItem(RESET_EMAIL_KEY);

        try {
          await syncCurrentUser(getToken, queryClient);
        } catch {
          setError(
            "Password updated, but could not load your profile. Please sign in again.",
          );
          return;
        }

        router.replace(DASHBOARD_ROUTE);
        return;
      }

      setError("Could not reset password. Please try again.");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/sign-in/forgot-password"
        className="mb-[18px] inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#64748b] hover:text-[#475569]"
      >
        <MsIcon name="arrow_back" size={18} />
        Back
      </Link>

      <AuthHeading
        title="Set a new password"
        subtitle={
          email
            ? `Enter the code we sent to ${email} and choose a new password.`
            : "Enter your reset code and choose a new password."
        }
      />

      <AuthError message={error} />

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="mb-2 block text-[12.5px] font-semibold text-[#475569]">
            Reset code
          </label>
          <div className="flex justify-center gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => updateDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-[52px] w-[46px] rounded-xl border border-[#e7e9f2] bg-[#f8f9fc] text-center font-display text-[20px] font-bold text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white"
              />
            ))}
          </div>
        </div>

        <AuthField
          label="New password"
          icon="lock"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="auth"
          fullWidth
          disabled={loading || !isLoaded}
        >
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
