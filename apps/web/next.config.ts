import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
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
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
