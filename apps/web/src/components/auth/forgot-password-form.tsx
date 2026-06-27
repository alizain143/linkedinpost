"use client";

import Link from "next/link";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";
import {
  AuthError,
  AuthField,
  AuthHeading,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { usePpToast } from "@/providers/pp-toast-provider";

export function ForgotPasswordForm() {
  const { isLoaded, signIn } = useSignIn();
  const { showToast } = usePpToast();
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
        identifier: email,
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

      showToast("Reset link sent — check your inbox", "mark_email_read");
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message ?? "Could not send reset email.");
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
        subtitle="Enter your email and we'll send you a secure link to set a new password."
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
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
