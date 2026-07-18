/**
 * Clerk OIDC issuer / Frontend API base.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_CLERK_ISSUER
 * 2. NEXT_PUBLIC_CLERK_FRONTEND_API
 * 3. Decode from NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_/pk_live_ base64 host)
 */

function issuerFromHostOrUrl(raw: string): string | null {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.origin;
  } catch {
    return null;
  }
}

/** Decode Frontend API host from a Clerk publishable key. */
export function frontendApiFromPublishableKey(
  publishableKey: string | undefined | null,
): string | null {
  const key = publishableKey?.trim();
  if (!key) return null;

  const match = key.match(/^pk_(?:test|live)_(.+)$/);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const host = decoded.replace(/\$$/, "").trim();
    if (!host) return null;
    return issuerFromHostOrUrl(host);
  } catch {
    return null;
  }
}

export function getClerkIssuer(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_CLERK_ISSUER?.trim() ||
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API?.trim() ||
    "";

  if (raw) {
    return issuerFromHostOrUrl(raw);
  }

  return frontendApiFromPublishableKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

export type OidcDiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
  grant_types_supported: string[];
  response_types_supported: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  scopes_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
};

/** Build Clerk-compatible OIDC discovery from issuer origin. */
export function buildClerkOidcDiscovery(
  issuer: string,
): OidcDiscoveryDocument {
  const base = issuer.replace(/\/$/, "");
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    jwks_uri: `${base}/.well-known/jwks.json`,
    userinfo_endpoint: `${base}/oauth/userinfo`,
    grant_types_supported: ["authorization_code", "refresh_token"],
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
  };
}

/**
 * Prefer live Clerk discovery; fall back to constructed metadata.
 */
export async function resolveClerkOidcDiscovery(): Promise<OidcDiscoveryDocument | null> {
  const issuer = getClerkIssuer();
  if (!issuer) return null;

  try {
    const res = await fetch(`${issuer}/.well-known/openid-configuration`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as OidcDiscoveryDocument;
      if (data.issuer && data.authorization_endpoint && data.token_endpoint) {
        return data;
      }
    }
  } catch {
    /* fall through */
  }

  return buildClerkOidcDiscovery(issuer);
}
