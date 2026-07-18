import { resolveClerkOidcDiscovery } from "@/lib/auth/clerk-discovery";

/** OAuth 2.0 Authorization Server Metadata (RFC 8414) — delegates to Clerk. */
export async function GET() {
  const discovery = await resolveClerkOidcDiscovery();

  if (!discovery) {
    return Response.json(
      {
        error:
          "Clerk issuer not configured. Set NEXT_PUBLIC_CLERK_FRONTEND_API or NEXT_PUBLIC_CLERK_ISSUER.",
      },
      { status: 503 },
    );
  }

  return Response.json(
    {
      issuer: discovery.issuer,
      authorization_endpoint: discovery.authorization_endpoint,
      token_endpoint: discovery.token_endpoint,
      jwks_uri: discovery.jwks_uri,
      userinfo_endpoint: discovery.userinfo_endpoint,
      grant_types_supported: discovery.grant_types_supported,
      response_types_supported: discovery.response_types_supported,
      scopes_supported: discovery.scopes_supported,
      token_endpoint_auth_methods_supported:
        discovery.token_endpoint_auth_methods_supported,
      subject_types_supported: discovery.subject_types_supported,
      id_token_signing_alg_values_supported:
        discovery.id_token_signing_alg_values_supported,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
