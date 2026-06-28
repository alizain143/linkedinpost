"use client";

import Link from "next/link";
import { useSignUp } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthHeading,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { clerkErrorMessage } from "@/lib/auth/clerk";

export function SignUpForm() {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError(null);

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      sessionStorage.setItem("pp_verify_email", email);
      router.push("/sign-up/verify-email");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuthHeading
        title="Create your account"
        subtitle="Start with 5 free posts. No credit card required."
      />

      <AuthSocialButtons
        mode="sign-up"
        disabled={loading}
        onError={setError}
      />

      <AuthDivider />
      <AuthError message={error} />

      <form onSubmit={handleSubmit}>
        <AuthField
          label="Full name"
          icon="person"
          value={name}
          onChange={setName}
          placeholder="Maya Reyes"
          autoComplete="name"
          required
        />
        <AuthField
          label="Work email"
          icon="mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <AuthField
          label="Password"
          icon="lock"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />

        <label className="mb-5 flex cursor-pointer items-start gap-2 text-[13px] text-[#64748b]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-[15px] w-[15px] accent-[#4f46e5]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-[#4f46e5]">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-[#4f46e5]">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <div id="clerk-captcha" className="mb-4" />

        <Button
          type="submit"
          variant="primary"
          size="auth"
          fullWidth
          disabled={loading || !isLoaded}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <AuthFooterLink
        text="Already have an account?"
        linkText="Sign in"
        href="/sign-in"
      />
    </div>
  );
}
