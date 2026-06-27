export const LINKEDIN_OAUTH_STRATEGY = "oauth_linkedin_oidc" as const;
export const LINKEDIN_PUBLISH_SCOPE = "w_member_social" as const;
export const LINKEDIN_CONNECT_CALLBACK = "/app/linkedin/callback";
export const LINKEDIN_CONNECT_COMPLETE = "/app/dashboard";

const LINKEDIN_PROVIDERS = new Set([
  "linkedin_oidc",
  "oauth_linkedin_oidc",
  "linkedin",
]);

type LinkedInExternalAccount = {
  provider: string;
  firstName: string | null;
  lastName: string | null;
  username?: string | null;
  emailAddress: string;
  approvedScopes?: string;
  verification: { status: string | null } | null;
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
