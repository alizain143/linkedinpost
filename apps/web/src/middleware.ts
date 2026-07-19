import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  buildPageMarkdown,
  estimateMarkdownTokens,
  isMarketingMarkdownPath,
  prefersMarkdown,
} from "@/lib/agent/markdown-pages";

/** RFC 8288 / RFC 9727 agent discovery Link relations for the homepage. */
export const AGENT_DISCOVERY_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"',
  '</.well-known/agent-skills/index.json>; rel="describedby"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</auth.md>; rel="service-doc"',
  '</.well-known/mcp/server-card.json>; rel="describedby"',
].join(", ");

const isPublicRoute = createRouteMatcher([
  "/",
  "/features",
  "/how-it-works",
  "/guides(.*)",
  "/pricing",
  "/faq",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/auth.md",
  "/webmcp",
  "/mcp",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
  // IndexNow ownership key (Bing / Yandex / etc.)
  "/0e557d58d8924450975abdf0822ad276.txt",
  "/.well-known(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/approve(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (request.method === "GET") {
    const { pathname } = request.nextUrl;
    if (
      isMarketingMarkdownPath(pathname) &&
      prefersMarkdown(request.headers.get("accept"))
    ) {
      const markdown = buildPageMarkdown(pathname);
      if (markdown) {
        return new NextResponse(markdown, {
          status: 200,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "x-markdown-tokens": String(estimateMarkdownTokens(markdown)),
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Ensure agent-useful Link relations survive Next font preload Links.
  if (request.nextUrl.pathname === "/") {
    const response = NextResponse.next();
    response.headers.append("Link", AGENT_DISCOVERY_LINK_HEADER);
    return response;
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
