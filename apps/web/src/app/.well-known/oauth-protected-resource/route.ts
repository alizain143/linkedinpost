import { getApiOrigin } from "@/lib/api/api-origin";
import { getSiteUrl } from "@/lib/site";

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 * Also published on the API host — scanners resolve PRM from the resource origin.
 */
export function GET() {
  const site = getSiteUrl().origin;
  const resource = getApiOrigin();

  return Response.json(
    {
      resource,
      authorization_servers: [site],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "profile", "email"],
      resource_documentation: `${site}/auth.md`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
