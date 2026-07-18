import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  buildPageMarkdown,
  estimateMarkdownTokens,
  isMarketingMarkdownPath,
  prefersMarkdown,
} from "@/lib/agent/markdown-pages";

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
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
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
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
