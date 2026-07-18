import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export function GET() {
  const origin = getSiteUrl().origin;

  return Response.json({
    version: "1.0",
    publisher: SITE_NAME,
    description: SITE_DESCRIPTION,
    skills: [
      {
        name: "site-discovery",
        description: "Discover linkedinpost.ai pages, pricing, and LLM indexes.",
        path: "/.well-known/agent-skills/site-discovery/SKILL.md",
      },
    ],
    discovery: {
      llmsTxt: `${origin}/llms.txt`,
      llmsFullTxt: `${origin}/llms-full.txt`,
      sitemap: `${origin}/sitemap.xml`,
      robotsTxt: `${origin}/robots.txt`,
      apiCatalog: `${origin}/.well-known/api-catalog`,
      authMd: `${origin}/auth.md`,
      oauthProtectedResource: `${origin}/.well-known/oauth-protected-resource`,
      openidConfiguration: `${origin}/.well-known/openid-configuration`,
    },
  });
}
