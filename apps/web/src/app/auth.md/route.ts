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
  const issuer = getClerkIssuer() ?? "(configure NEXT_PUBLIC_CLERK_FRONTEND_API)";

  const body = `# auth.md

Agent and API authentication for linkedinpost.ai.

## Audience

- **Humans** create accounts in the browser via Clerk at [${site}/sign-up](${site}/sign-up).
- **Clients and agents** call the protected HTTP API with a Clerk session JWT as a Bearer token.

Programmatic agent registration (Auth.md register/claim flows) is **not** offered. Use a normal user account and a Clerk JWT.

## Human registration

1. Open [${site}/sign-up](${site}/sign-up).
2. Sign up with email/password or a supported social provider.
3. Sign in at [${site}/sign-in](${site}/sign-in).

## API authentication

1. Obtain a Clerk session JWT for a registered user (browser session or Clerk Backend/Frontend SDK).
2. Call the API with:

\`\`\`http
Authorization: Bearer <clerk_session_jwt>
\`\`\`

3. API base URL: \`${api}/v1\`

## Discovery documents

| Document | URL |
|----------|-----|
| OAuth Protected Resource Metadata | [${site}/.well-known/oauth-protected-resource](${site}/.well-known/oauth-protected-resource) |
| OpenID Provider Configuration | [${site}/.well-known/openid-configuration](${site}/.well-known/openid-configuration) |
| Authorization Server Metadata | [${site}/.well-known/oauth-authorization-server](${site}/.well-known/oauth-authorization-server) |
| Clerk issuer | ${issuer} |
| OpenAPI (service-desc) | [${getApiOpenApiUrl()}](${getApiOpenApiUrl()}) |
| API docs (service-doc) | [${getApiDocsUrl()}](${getApiDocsUrl()}) |
| API catalog | [${site}/.well-known/api-catalog](${site}/.well-known/api-catalog) |

## Resource server

- **Resource identifier:** \`${api}\`
- **Authorization server:** Clerk (\`${issuer}\`)
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
