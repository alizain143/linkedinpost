"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublishedGuides } from "@/lib/guides/content";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";

type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (
    args: Record<string, unknown>,
    opts?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown;
};

type ModelContextApi = {
  registerTool?: (tool: ModelContextTool) => void;
  provideContext?: (ctx: { tools: ModelContextTool[] }) => void;
  unregisterTool?: (name: string) => void;
};

declare global {
  interface Navigator {
    modelContext?: ModelContextApi;
  }
}

const NAV_PATHS = {
  home: "/",
  features: "/features",
  "how-it-works": "/how-it-works",
  pricing: "/pricing",
  faq: "/faq",
  guides: "/guides",
  about: "/about",
  contact: "/contact",
  "sign-up": "/sign-up",
  "sign-in": "/sign-in",
} as const;

type NavKey = keyof typeof NAV_PATHS;

/**
 * Registers WebMCP tools when `navigator.modelContext` is available.
 * @see https://webmachinelearning.github.io/webmcp/
 */
export function WebMcpProvider() {
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let tries = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tools: ModelContextTool[] = [
      {
        name: "navigate_to_page",
        description:
          "Navigate to a linkedinpost.ai marketing or auth page by key.",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "string",
              enum: Object.keys(NAV_PATHS),
              description: "Page key to open",
            },
          },
          required: ["page"],
        },
        execute: async (args) => {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          const page = String(args.page ?? "") as NavKey;
          const path = NAV_PATHS[page];
          if (!path) {
            return { ok: false, error: `Unknown page: ${page}` };
          }
          router.push(path);
          return { ok: true, path };
        },
      },
      {
        name: "get_site_summary",
        description: "Return the linkedinpost.ai product summary and key links.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        execute: async () => {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          return {
            name: SITE_NAME,
            tagline: SITE_TAGLINE,
            description: SITE_DESCRIPTION,
            links: {
              home: "/",
              pricing: "/pricing",
              features: "/features",
              faq: "/faq",
              guides: "/guides",
              signUp: "/sign-up",
              llmsTxt: "/llms.txt",
              authMd: "/auth.md",
              apiCatalog: "/.well-known/api-catalog",
            },
          };
        },
      },
      {
        name: "list_guides",
        description: "List published LinkedIn content guides with titles and slugs.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        execute: async () => {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          return getPublishedGuides().map((g) => ({
            slug: g.slug,
            title: g.title,
            description: g.description,
            path: `/guides/${g.slug}`,
          }));
        },
      },
    ];

    const register = () => {
      const ctx = navigator.modelContext;
      if (!ctx) return false;
      try {
        if (typeof ctx.provideContext === "function") {
          ctx.provideContext({ tools });
        }
        if (typeof ctx.registerTool === "function") {
          for (const tool of tools) {
            ctx.registerTool(tool);
          }
        }
        return (
          typeof ctx.provideContext === "function" ||
          typeof ctx.registerTool === "function"
        );
      } catch {
        return false;
      }
    };

    if (!register()) {
      intervalId = setInterval(() => {
        if (register() || ++tries > 100) {
          if (intervalId) clearInterval(intervalId);
        }
      }, 50);
    }

    return () => {
      controller.abort();
      if (intervalId) clearInterval(intervalId);
      const ctx = navigator.modelContext;
      if (typeof ctx?.unregisterTool === "function") {
        for (const tool of tools) {
          try {
            ctx.unregisterTool(tool.name);
          } catch {
            /* ignore */
          }
        }
      }
    };
  }, [router]);

  return null;
}
