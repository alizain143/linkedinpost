import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/case-studies",
        destination: "/",
        permanent: true,
      },
      {
        source: "/case-studies/:path*",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS],
      },
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: [
              '</.well-known/api-catalog>; rel="api-catalog"',
              '</llms.txt>; rel="describedby"',
              '</.well-known/agent-skills/index.json>; rel="describedby"',
              '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
              '</auth.md>; rel="service-doc"',
              '</.well-known/mcp/server-card.json>; rel="describedby"',
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
