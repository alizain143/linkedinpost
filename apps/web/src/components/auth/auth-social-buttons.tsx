"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useSignUp } from "@clerk/nextjs/legacy";
import {
  AppleIcon,
  GoogleIcon,
  LinkedInIcon,
  useIsMac,
} from "@/components/auth/auth-icons";
import { authSocialBtnClass, authSocialBtnInnerClass, authSocialIconSlotClass } from "@/components/auth/auth-ui";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";
import { useRouter } from "next/navigation";

type OAuthStrategy =
  | "oauth_google"
  | "oauth_apple"
  | "oauth_linkedin_oidc";

type AuthSocialButtonsProps = {
  mode: "sign-in" | "sign-up";
  disabled?: boolean;
  onError: (message: string | null) => void;
};

export function AuthSocialButtons({
  mode,
  disabled,
  onError,
}: AuthSocialButtonsProps) {
  const router = useRouter();
  const isMac = useIsMac();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const isSignIn = mode === "sign-in";

  const googleLabel = isSignIn ? "Continue with Google" : "Sign up with Google";
  const appleLabel = isSignIn ? "Continue with Apple" : "Sign up with Apple";
  const linkedInLabel = "Continue with LinkedIn";

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (isAuthBypassEnabled()) {
      router.push("/app/dashboard");
      return;
    }

    const loaded = isSignIn ? signIn.isLoaded : signUp.isLoaded;
    const resource = isSignIn ? signIn.signIn : signUp.signUp;
    if (!loaded || !resource) return;

    onError("");
    try {
      await resource.authenticateWithRedirect({
        strategy,
        redirectUrl: isSignIn ? "/sign-in/sso-callback" : "/sign-up/sso-callback",
        redirectUrlComplete: "/app/dashboard",
      });
    } catch {
      onError("Could not start social sign in. Try email instead.");
    }
  };

  const bypass = isAuthBypassEnabled();
  const isDisabled =
    disabled ||
    (!bypass && (isSignIn ? !signIn.isLoaded : !signUp.isLoaded));

  return (
    <div className="mb-5 flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => handleOAuth("oauth_google")}
        className={authSocialBtnClass}
        disabled={isDisabled}
      >
        <span className={authSocialBtnInnerClass}>
          <span className={authSocialIconSlotClass}>
            <GoogleIcon />
          </span>
          {googleLabel}
        </span>
      </button>

      {isMac ? (
        <button
          type="button"
          onClick={() => handleOAuth("oauth_apple")}
          className={authSocialBtnClass}
          disabled={isDisabled}
        >
          <span className={authSocialBtnInnerClass}>
            <span className={authSocialIconSlotClass}>
              <AppleIcon />
            </span>
            {appleLabel}
          </span>
        </button>
      ) : null}

      {isSignIn ? (
        <button
          type="button"
          onClick={() => handleOAuth("oauth_linkedin_oidc")}
          className={authSocialBtnClass}
          disabled={isDisabled}
        >
          <span className={authSocialBtnInnerClass}>
            <span className={authSocialIconSlotClass}>
              <LinkedInIcon />
            </span>
            {linkedInLabel}
          </span>
        </button>
      ) : null}
    </div>
  );
}
