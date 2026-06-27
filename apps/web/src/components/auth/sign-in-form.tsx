"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthHeading,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";
import {
  clerkErrorMessage,
  needsEmailSecondFactor,
} from "@/lib/auth/clerk";
import { syncCurrentUser } from "@/lib/auth/finish-session";
import { DASHBOARD_ROUTE } from "@/lib/auth/routes";

const OTP_LENGTH = 6;

export function SignInForm() {
  const { getToken } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const bypass = isAuthBypassEnabled();

  const finishLogin = async (sessionId: string | null) => {
    if (!sessionId || !setActive) return false;

    await setActive({ session: sessionId });

    try {
      await syncCurrentUser(getToken, queryClient);
    } catch {
      setError("Signed in, but could not load your profile. Please try again.");
      return false;
    }

    router.replace(DASHBOARD_ROUTE);
    return true;
  };

  const beginEmailVerification = async (status: string | null, identifier: string) => {
    if (!signIn || !needsEmailSecondFactor(status)) return false;

    const emailCodeFactor = signIn.supportedSecondFactors?.find(
      (factor) => factor.strategy === "email_code" && "emailAddressId" in factor,
    );

    if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) return false;

    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailCodeFactor.emailAddressId,
    });

    setVerifyEmail(
      "safeIdentifier" in emailCodeFactor &&
        typeof emailCodeFactor.safeIdentifier === "string"
        ? emailCodeFactor.safeIdentifier
        : identifier.trim(),
    );
    setDigits(Array(OTP_LENGTH).fill(""));
    setPendingVerification(true);
    return true;
  };

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

  const handleVerify = async () => {
    if (!isLoaded || !signIn) return;
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: code.trim(),
      });

      if (result.status === "complete") {
        await finishLogin(result.createdSessionId);
        return;
      }

      setError("Verification incomplete. Please try again.");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bypass) {
      router.push(DASHBOARD_ROUTE);
      return;
    }
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await finishLogin(result.createdSessionId);
        return;
      }

      if (await beginEmailVerification(result.status, email)) return;

      setError(
        "Additional verification is required. Please try another method.",
      );
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-[#eef2ff]">
          <MsIcon name="mark_email_unread" size={30} className="text-[#4f46e5]" />
        </div>
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
          Check your email
        </h1>
        <p className="mx-auto mt-2 mb-[26px] max-w-[340px] text-[14.5px] leading-[1.55] text-[#64748b]">
          We sent a 6-digit code to{" "}
          <strong className="text-[#1e293b]">{verifyEmail}</strong>. Enter it to
          finish signing in.
        </p>

        <AuthError message={error} />

        <div className="mb-6 flex justify-center gap-2">
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
              className="h-[58px] w-[50px] rounded-xl border border-[#e7e9f2] bg-[#f8f9fc] text-center font-display text-[22px] font-bold text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white"
            />
          ))}
        </div>

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

        <p className="text-[13.5px]">
          <button
            type="button"
            onClick={() => {
              setPendingVerification(false);
              setError(null);
            }}
            className="font-semibold text-[#64748b] hover:text-[#475569]"
          >
            ← Back to sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to keep your content engine running."
      />

      <AuthSocialButtons mode="sign-in" disabled={loading} onError={setError} />

      <AuthDivider />
      <AuthError message={error} />

      <form onSubmit={handleSubmit} noValidate={bypass}>
        <AuthField
          label="Email"
          icon="mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />

        <InputField
          label="Password"
          icon="lock"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          fieldClassName="mb-4"
          variant="auth-icon"
          labelAside={
            <Link
              href="/sign-in/forgot-password"
              className="text-[12.5px] font-semibold text-[#4f46e5] hover:text-[#4338ca]"
            >
              Forgot password?
            </Link>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="auth"
          fullWidth
          disabled={loading || (!bypass && !isLoaded)}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <AuthFooterLink
        text="New here?"
        linkText="Create an account"
        href="/sign-up"
      />
    </div>
  );
}
