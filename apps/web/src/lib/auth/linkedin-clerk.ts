export const LINKEDIN_OAUTH_STRATEGY = "oauth_linkedin_oidc" as const;
export const LINKEDIN_PUBLISH_SCOPE = "w_member_social" as const;
export const LINKEDIN_CONNECT_CALLBACK = "/app/linkedin/callback";
export const LINKEDIN_CONNECT_COMPLETE = "/app/dashboard";

const LINKEDIN_PROVIDERS = new Set([
  "linkedin_oidc",
  "oauth_linkedin_oidc",
  "linkedin",
]);

export type LinkedInExternalAccount = {
  id: string;
  provider: string;
  firstName: string | null;
  lastName: string | null;
  username?: string | null;
  emailAddress: string;
  approvedScopes?: string;
  verification: {
    status: string | null;
    externalVerificationRedirectURL?: URL | null;
  } | null;
  reauthorize?: (params: {
    additionalScopes?: string[];
    redirectUrl?: string;
  }) => Promise<unknown>;
  destroy?: () => Promise<unknown>;
};

type ClerkUserWithExternalAccounts = {
  externalAccounts: LinkedInExternalAccount[];
};

export function isLinkedInProvider(provider: string) {
  return LINKEDIN_PROVIDERS.has(provider);
}

export function findLinkedInExternalAccount(
  user: ClerkUserWithExternalAccounts | null | undefined,
) {
  return user?.externalAccounts.find(
    (account) =>
      isLinkedInProvider(account.provider) &&
      account.verification?.status === "verified",
  );
}

export function listLinkedInExternalAccounts(
  user: ClerkUserWithExternalAccounts | null | undefined,
) {
  return (
    user?.externalAccounts.filter((account) =>
      isLinkedInProvider(account.provider),
    ) ?? []
  );
}

/** Clerk supports multiple LinkedIn external accounts — keep each workspace bound to its own. */
export async function destroyAllLinkedInExternalAccounts(
  user: ClerkUserWithExternalAccounts & { reload?: () => Promise<unknown> },
  destroy: (account: LinkedInExternalAccount) => Promise<unknown>,
) {
  for (const account of listLinkedInExternalAccounts(user)) {
    if (account.destroy) {
      await destroy(account);
    }
  }
  await user.reload?.();
}

/** Prefer verified + publish-ready; otherwise resume an in-progress link. */
export function findLinkedInAccountForConnect(
  user: ClerkUserWithExternalAccounts | null | undefined,
) {
  const accounts = listLinkedInExternalAccounts(user);
  const verified = accounts.filter(
    (account) => account.verification?.status === "verified",
  );
  const publishReady = verified.find((account) =>
    getLinkedInApprovedScopes(account).includes(LINKEDIN_PUBLISH_SCOPE),
  );
  if (publishReady) return publishReady;
  if (verified[0]) return verified[0];

  return (
    accounts.find((account) => account.verification?.status !== "verified") ??
    null
  );
}

export function getLinkedInProfileName(
  user: ClerkUserWithExternalAccounts | null | undefined,
  account?: LinkedInExternalAccount | null,
) {
  const linkedInAccount = account ?? findLinkedInExternalAccount(user);
  if (!linkedInAccount) return null;

  const fromAccount = [linkedInAccount.firstName, linkedInAccount.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fromAccount) return fromAccount;
  if (linkedInAccount.username) return linkedInAccount.username;
  if (linkedInAccount.emailAddress) return linkedInAccount.emailAddress;

  return null;
}

export function isLinkedInConnected(
  user: ClerkUserWithExternalAccounts | null | undefined,
) {
  return Boolean(findLinkedInExternalAccount(user));
}

export function getLinkedInApprovedScopes(
  account?: LinkedInExternalAccount | null,
) {
  if (!account?.approvedScopes) return [] as string[];
  return account.approvedScopes
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function isLinkedInPublishReady(
  user: ClerkUserWithExternalAccounts | null | undefined,
  account?: LinkedInExternalAccount | null,
) {
  const linkedInAccount = account ?? findLinkedInExternalAccount(user);
  if (!linkedInAccount) return false;
  return getLinkedInApprovedScopes(linkedInAccount).includes(
    LINKEDIN_PUBLISH_SCOPE,
  );
}

export function getExternalVerificationRedirectUrl(
  account: LinkedInExternalAccount | null | undefined,
) {
  return account?.verification?.externalVerificationRedirectURL?.href ?? null;
}

/** Custom Clerk flows must navigate to the provider OAuth URL themselves. */
export function redirectToExternalAccountVerification(
  account: LinkedInExternalAccount,
) {
  const href = getExternalVerificationRedirectUrl(account);
  if (!href) return false;
  window.location.assign(href);
  return true;
}
