import Script from "next/script";

/**
 * Early WebMCP registration so scanners detect tools before React hydrates.
 * Prefer provideContext (Chrome EPP); also call registerTool when available.
 */
export function WebMcpBootstrap() {
  const code = `
(function () {
  var TOOLS = [
    {
      name: "navigate_to_page",
      description: "Navigate to a linkedinpost.ai marketing or auth page by key.",
      inputSchema: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["home","features","how-it-works","pricing","faq","guides","about","contact","sign-up","sign-in"]
          }
        },
        required: ["page"]
      },
      execute: function (args) {
        var map = {
          home: "/",
          features: "/features",
          "how-it-works": "/how-it-works",
          pricing: "/pricing",
          faq: "/faq",
          guides: "/guides",
          about: "/about",
          contact: "/contact",
          "sign-up": "/sign-up",
          "sign-in": "/sign-in"
        };
        var path = map[String((args && args.page) || "")];
        if (!path) return { ok: false, error: "Unknown page" };
        window.location.assign(path);
        return { ok: true, path: path };
      }
    },
    {
      name: "get_site_summary",
      description: "Return the linkedinpost.ai product summary and key links.",
      inputSchema: { type: "object", properties: {} },
      execute: function () {
        return {
          name: "linkedinpost.ai",
          tagline: "Create a month of LinkedIn content in minutes with AI",
          links: {
            home: "/",
            pricing: "/pricing",
            features: "/features",
            faq: "/faq",
            guides: "/guides",
            signUp: "/sign-up",
            authMd: "/auth.md",
            apiCatalog: "/.well-known/api-catalog",
            mcp: "/mcp"
          }
        };
      }
    },
    {
      name: "list_guides",
      description: "List published LinkedIn content guide paths.",
      inputSchema: { type: "object", properties: {} },
      execute: function () {
        return [
          { slug: "linkedin-posts-dont-sound-like-ai", path: "/guides/linkedin-posts-dont-sound-like-ai" },
          { slug: "linkedin-content-calendar-template", path: "/guides/linkedin-content-calendar-template" },
          { slug: "linkedin-posting-frequency-founders", path: "/guides/linkedin-posting-frequency-founders" },
          { slug: "linkedin-hooks-that-get-engagement", path: "/guides/linkedin-hooks-that-get-engagement" }
        ];
      }
    }
  ];

  function register() {
    var ctx = navigator.modelContext;
    if (!ctx) return false;
    try {
      if (typeof ctx.provideContext === "function") {
        ctx.provideContext({ tools: TOOLS });
      }
      if (typeof ctx.registerTool === "function") {
        for (var i = 0; i < TOOLS.length; i++) ctx.registerTool(TOOLS[i]);
      }
      return typeof ctx.provideContext === "function" || typeof ctx.registerTool === "function";
    } catch (e) {
      return false;
    }
  }

  if (register()) return;
  var n = 0;
  var id = setInterval(function () {
    if (register() || ++n > 100) clearInterval(id);
  }, 50);
})();
`;

  return (
    <Script id="webmcp-bootstrap" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
