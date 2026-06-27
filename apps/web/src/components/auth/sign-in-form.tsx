"use client";

import Link from "next/link";
import { useSignIn } from "@clerk/nextjs/legacy";
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
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bypass = isAuthBypassEnabled();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bypass) {
      router.push("/app/dashboard");
      return;
    }
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/app/dashboard");
        return;
      }
      setError(
        "Additional verification is required. Please try another method.",
      );
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

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
