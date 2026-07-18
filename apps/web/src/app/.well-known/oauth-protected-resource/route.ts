import { getApiOrigin } from "@/lib/api/api-origin";
import { getClerkIssuer } from "@/lib/auth/clerk-discovery";
import { getSiteUrl } from "@/lib/site";

/** OAuth 2.0 Protected Resource Metadata (RFC 9728). */
export function GET() {
  const resource = getApiOrigin();
  const issuer = getClerkIssuer();

  if (!issuer) {
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
      resource,
      authorization_servers: [issuer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "profile", "email"],
      resource_documentation: `${getSiteUrl().origin}/auth.md`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
