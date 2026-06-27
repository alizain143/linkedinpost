'use client';

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

export function HeaderAuth() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <SignInButton mode="modal">
      <button className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
        Sign in
      </button>
    </SignInButton>
  );
}
