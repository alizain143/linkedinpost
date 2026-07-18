import { getApiOrigin } from "@/lib/api/api-origin";
import {
  buildClerkOidcDiscovery,
  getClerkIssuer,
  resolveClerkOidcDiscovery,
} from "@/lib/auth/clerk-discovery";
import { getSiteUrl } from "@/lib/site";

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414) + Auth.md agent_auth.
 * `claim_uri` / `register_uri` are top-level (isitagentready / agents-txt.com schema).
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

  const registerUri = `${site}/sign-up`;
  const claimUri = `${site}/sign-up`;

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
      resource: getApiOrigin(),
      agent_auth: {
        skill: `${site}/auth.md`,
        register_uri: registerUri,
        claim_uri: claimUri,
        revocation_uri: `${site}/sign-in`,
        identity_types_supported: ["anonymous", "identity_assertion"],
        anonymous: {
          credential_types_supported: ["bearer"],
        },
        identity_assertion: {
          assertion_types_supported: ["verified_email"],
          credential_types_supported: ["bearer"],
        },
        events_supported: [
          "https://schemas.workos.com/events/agent/auth/identity/assertion/revoked",
        ],
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
