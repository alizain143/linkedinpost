import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export function GET() {
  const origin = getSiteUrl().origin;

  return Response.json(
    {
      serverInfo: {
        name: SITE_NAME,
        version: "1.0.0",
        description: SITE_DESCRIPTION,
      },
      url: `${origin}/mcp`,
      transport: {
        type: "streamable-http",
        endpoint: "/mcp",
      },
      capabilities: {
        tools: {
          listChanged: false,
        },
        resources: {
          subscribe: false,
          listChanged: false,
        },
        prompts: {
          listChanged: false,
        },
      },
      tools: [
        {
          name: "get_site_summary",
          description: "Product summary and key discovery URLs for linkedinpost.ai",
        },
        {
          name: "list_guides",
          description: "List published LinkedIn content guides",
        },
        {
          name: "get_discovery_links",
          description: "Return robots, sitemap, llms.txt, api-catalog, and auth.md URLs",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
