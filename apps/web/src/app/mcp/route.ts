import { getPublishedGuides } from "@/lib/guides/content";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/site";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const TOOLS = [
  {
    name: "get_site_summary",
    description: "Return the linkedinpost.ai product summary and key links.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_guides",
    description: "List published LinkedIn content guides with titles and slugs.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_discovery_links",
    description:
      "Return agent discovery URLs (robots, sitemap, llms.txt, api-catalog, auth).",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function jsonRpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
) {
  return Response.json({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });
}

function toolText(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text:
          typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function runTool(name: string) {
  const origin = getSiteUrl().origin;

  switch (name) {
    case "get_site_summary":
      return toolText({
        name: SITE_NAME,
        tagline: SITE_TAGLINE,
        description: SITE_DESCRIPTION,
        links: {
          home: `${origin}/`,
          pricing: `${origin}/pricing`,
          features: `${origin}/features`,
          faq: `${origin}/faq`,
          guides: `${origin}/guides`,
          signUp: `${origin}/sign-up`,
        },
      });
    case "list_guides":
      return toolText(
        getPublishedGuides().map((g) => ({
          slug: g.slug,
          title: g.title,
          description: g.description,
          path: `/guides/${g.slug}`,
        })),
      );
    case "get_discovery_links":
      return toolText({
        robotsTxt: `${origin}/robots.txt`,
        sitemap: `${origin}/sitemap.xml`,
        llmsTxt: `${origin}/llms.txt`,
        apiCatalog: `${origin}/.well-known/api-catalog`,
        authMd: `${origin}/auth.md`,
        oauthProtectedResource: `${origin}/.well-known/oauth-protected-resource`,
        openidConfiguration: `${origin}/.well-known/openid-configuration`,
        mcpServerCard: `${origin}/.well-known/mcp/server-card.json`,
      });
    default:
      return null;
  }
}

async function handleRpc(body: JsonRpcRequest) {
  const method = body.method ?? "";

  if (method === "initialize") {
    return jsonRpcResult(body.id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      serverInfo: {
        name: SITE_NAME,
        version: "1.0.0",
      },
    });
  }

  if (method === "notifications/initialized" || method === "ping") {
    return jsonRpcResult(body.id, {});
  }

  if (method === "tools/list") {
    return jsonRpcResult(body.id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = String(body.params?.name ?? "");
    const result = runTool(name);
    if (!result) {
      return jsonRpcError(body.id, -32601, `Unknown tool: ${name}`);
    }
    return jsonRpcResult(body.id, result);
  }

  if (method === "resources/list") {
    return jsonRpcResult(body.id, { resources: [] });
  }

  if (method === "prompts/list") {
    return jsonRpcResult(body.id, { prompts: [] });
  }

  return jsonRpcError(body.id, -32601, `Method not found: ${method}`);
}

export async function GET() {
  return Response.json({
    name: SITE_NAME,
    transport: "streamable-http",
    message: "POST JSON-RPC to this endpoint. See /.well-known/mcp/server-card.json",
  });
}

export async function POST(request: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  return handleRpc(body);
}
