import {
  getApiDocsUrl,
  getApiOpenApiUrl,
  getApiOrigin,
} from "@/lib/api/api-origin";
import { getClerkIssuer } from "@/lib/auth/clerk-discovery";
import { getSiteUrl } from "@/lib/site";

export function GET() {
  const site = getSiteUrl().origin;
  const api = getApiOrigin();
  const clerkIssuer =
    getClerkIssuer() ?? "(configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)";

  const body = `# auth.md

Agent and API authentication for linkedinpost.ai.

## Audience

- **Humans** create accounts in the browser via Clerk at [${site}/sign-up](${site}/sign-up).
- **Clients and agents** call the protected HTTP API with a Clerk session JWT as a Bearer token.

Agent registration uses the Auth.md \`agent_auth\` discovery block on the site authorization server metadata. Programmatic ID-JAG issuance is not offered yet — register via \`${site}/sign-up\`, then use a Clerk Bearer JWT.

## Human / agent registration

1. Open [${site}/sign-up](${site}/sign-up) (\`agent_auth.register_uri\`).
2. Sign up with email/password or a supported social provider.
3. Sign in at [${site}/sign-in](${site}/sign-in).
4. Obtain a Clerk session JWT and call the API.

## API authentication

1. Obtain a Clerk session JWT for a registered user (browser session or Clerk Backend/Frontend SDK).
2. Call the API with:

\`\`\`http
Authorization: Bearer <clerk_session_jwt>
\`\`\`

3. API base URL: \`${api}/v1\`
4. JWT issuer (Clerk): \`${clerkIssuer}\`

## Discovery documents

| Document | URL |
|----------|-----|
| OAuth Protected Resource Metadata (API) | [${api}/.well-known/oauth-protected-resource](${api}/.well-known/oauth-protected-resource) |
| OAuth Protected Resource Metadata (site) | [${site}/.well-known/oauth-protected-resource](${site}/.well-known/oauth-protected-resource) |
| Authorization Server Metadata (+ agent_auth) | [${site}/.well-known/oauth-authorization-server](${site}/.well-known/oauth-authorization-server) |
| OpenID Provider Configuration | [${site}/.well-known/openid-configuration](${site}/.well-known/openid-configuration) |
| OpenAPI (service-desc) | [${getApiOpenApiUrl()}](${getApiOpenApiUrl()}) |
| API docs (service-doc) | [${getApiDocsUrl()}](${getApiDocsUrl()}) |
| API catalog | [${site}/.well-known/api-catalog](${site}/.well-known/api-catalog) |

## Resource server

- **Resource identifier:** \`${api}\`
- **Authorization server (discovery):** \`${site}\` (see \`agent_auth\` in AS metadata)
- **Token issuer (Clerk JWTs):** \`${clerkIssuer}\`
- **Bearer method:** HTTP \`Authorization\` header
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
