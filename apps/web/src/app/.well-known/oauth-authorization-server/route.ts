import { getApiOrigin } from "@/lib/api/api-origin";
import {
  buildClerkOidcDiscovery,
  getClerkIssuer,
  resolveClerkOidcDiscovery,
} from "@/lib/auth/clerk-discovery";
import { getSiteUrl } from "@/lib/site";

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414) + Auth.md agent_auth.
 * Issuer is the marketing site so PRM → AS discovery stays on an origin we control
 * (Clerk remains the real token issuer documented in auth.md).
 */
export async function GET() {
  const site = getSiteUrl().origin;
  const clerkIssuer = getClerkIssuer();
  const clerk =
    (await resolveClerkOidcDiscovery()) ??
    (clerkIssuer ? buildClerkOidcDiscovery(clerkIssuer) : null);

  if (!clerk) {
    return Response.json(
      {
        error:
          "Clerk issuer not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_FRONTEND_API.",
      },
      { status: 503 },
    );
  }

  return Response.json(
    {
      issuer: site,
      authorization_endpoint: clerk.authorization_endpoint,
      token_endpoint: clerk.token_endpoint,
      jwks_uri: clerk.jwks_uri,
      userinfo_endpoint: clerk.userinfo_endpoint,
      grant_types_supported: clerk.grant_types_supported,
      response_types_supported: clerk.response_types_supported,
      scopes_supported: clerk.scopes_supported,
      token_endpoint_auth_methods_supported:
        clerk.token_endpoint_auth_methods_supported,
      subject_types_supported: clerk.subject_types_supported,
      id_token_signing_alg_values_supported:
        clerk.id_token_signing_alg_values_supported,
      agent_auth: {
        skill: `${site}/auth.md`,
        register_uri: `${site}/sign-up`,
        identity_types_supported: ["anonymous", "identity_assertion"],
        identity_assertion: {
          assertion_types_supported: ["verified_email"],
          credential_types_supported: ["bearer"],
          claim_uri: `${site}/sign-up`,
        },
        anonymous: {
          credential_types_supported: ["bearer"],
          claim_uri: `${site}/sign-up`,
        },
      },
      resource: getApiOrigin(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
