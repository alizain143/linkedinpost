"use client";

import Link from "next/link";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthError,
  AuthField,
  AuthHeading,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { clerkErrorMessage } from "@/lib/auth/clerk";

const RESET_EMAIL_KEY = "pp_reset_email";

export function ForgotPasswordForm() {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError(null);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });

      const factor = signIn.supportedFirstFactors?.find(
        (f) => f.strategy === "reset_password_email_code",
      );

      if (factor && "emailAddressId" in factor) {
        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: factor.emailAddressId,
        });
      }

      sessionStorage.setItem(RESET_EMAIL_KEY, email.trim());
      router.push("/sign-in/reset-password");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/sign-in"
        className="mb-[18px] inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#64748b] hover:text-[#475569]"
      >
        <MsIcon name="arrow_back" size={18} />
        Back to sign in
      </Link>

      <AuthHeading
        title="Reset your password"
        subtitle="Enter your email and we'll send you a code to set a new password."
      />

      <AuthError message={error} />

      <form onSubmit={handleSubmit}>
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

        <Button type="submit" variant="primary" size="auth" fullWidth disabled={loading || !isLoaded}>
          {loading ? "Sending…" : "Send reset code"}
        </Button>
      </form>
    </div>
  );
}

export { RESET_EMAIL_KEY };
