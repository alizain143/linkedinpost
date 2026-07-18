import { getApiOrigin } from "@/lib/api/api-origin";
import { getSiteUrl } from "@/lib/site";

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 *
 * When served from the marketing host, `resource` must match that host's origin
 * (isitagentready rejects api.* resource on www with "origin mismatch").
 * The API host publishes its own PRM with resource=api origin.
 */
export function GET(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const site = getSiteUrl().origin;
  const api = getApiOrigin();
  const isApiHost =
    requestOrigin === api ||
    requestOrigin.includes("api.") ||
    requestOrigin.includes("localhost:3001");

  const resource = isApiHost ? api : requestOrigin;
  // Prefer canonical site for AS discovery (has agent_auth); fall back to request host.
  const authorizationServer = site;

  return Response.json(
    {
      resource,
      authorization_servers: [authorizationServer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "profile", "email"],
      resource_documentation: `${site}/auth.md`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
