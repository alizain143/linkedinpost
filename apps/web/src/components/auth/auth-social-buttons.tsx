"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useSignUp } from "@clerk/nextjs/legacy";
import {
  AppleIcon,
  GoogleIcon,
  LinkedInIcon,
} from "@/components/auth/auth-icons";
import {
  authSocialBtnClass,
  authSocialBtnInnerClass,
  authSocialIconSlotClass,
} from "@/components/auth/auth-ui";
import { useAppleSignInAvailable } from "@/hooks/use-apple-sign-in-available";
import { clerkErrorMessage } from "@/lib/auth/clerk";
import {
  SIGN_IN_OAUTH_COMPLETE_URL,
  SIGN_IN_OAUTH_REDIRECT_URL,
  SIGN_UP_OAUTH_COMPLETE_URL,
  SIGN_UP_OAUTH_REDIRECT_URL,
} from "@/lib/auth/routes";
import { useState } from "react";

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
  const appleAvailable = useAppleSignInAvailable();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const isSignIn = mode === "sign-in";

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);

  const googleLabel = isSignIn ? "Continue with Google" : "Sign up with Google";
  const appleLabel = isSignIn ? "Continue with Apple" : "Sign up with Apple";
  const linkedInLabel = isSignIn
    ? "Continue with LinkedIn"
    : "Sign up with LinkedIn";

  const oauthLoading = googleLoading || appleLoading || linkedInLoading;

  const handleOAuth = async (
    strategy: OAuthStrategy,
    setLoading: (value: boolean) => void,
  ) => {
    const loaded = isSignIn ? signIn.isLoaded : signUp.isLoaded;
    const resource = isSignIn ? signIn.signIn : signUp.signUp;
    if (!loaded || !resource || disabled || oauthLoading) return;

    onError(null);
    setLoading(true);
    try {
      await resource.authenticateWithRedirect({
        strategy,
        redirectUrl: isSignIn
          ? SIGN_IN_OAUTH_REDIRECT_URL
          : SIGN_UP_OAUTH_REDIRECT_URL,
        redirectUrlComplete: isSignIn
          ? SIGN_IN_OAUTH_COMPLETE_URL
          : SIGN_UP_OAUTH_COMPLETE_URL,
      });
    } catch (err) {
      onError(clerkErrorMessage(err));
      setLoading(false);
    }
  };

  const isDisabled =
    disabled ||
    oauthLoading ||
    (isSignIn ? !signIn.isLoaded : !signUp.isLoaded);

  return (
    <div className="mb-5 flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => void handleOAuth("oauth_google", setGoogleLoading)}
        className={authSocialBtnClass}
        disabled={isDisabled}
      >
        <span className={authSocialBtnInnerClass}>
          <span className={authSocialIconSlotClass}>
            <GoogleIcon />
          </span>
          {googleLoading ? "Connecting…" : googleLabel}
        </span>
      </button>

      {appleAvailable ? (
        <button
          type="button"
          onClick={() => void handleOAuth("oauth_apple", setAppleLoading)}
          className={authSocialBtnClass}
          disabled={isDisabled}
        >
          <span className={authSocialBtnInnerClass}>
            <span className={authSocialIconSlotClass}>
              <AppleIcon />
            </span>
            {appleLoading ? "Connecting…" : appleLabel}
          </span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => void handleOAuth("oauth_linkedin_oidc", setLinkedInLoading)}
        className={authSocialBtnClass}
        disabled={isDisabled}
      >
        <span className={authSocialBtnInnerClass}>
          <span className={authSocialIconSlotClass}>
            <LinkedInIcon />
          </span>
          {linkedInLoading ? "Connecting…" : linkedInLabel}
        </span>
      </button>
    </div>
  );
}
