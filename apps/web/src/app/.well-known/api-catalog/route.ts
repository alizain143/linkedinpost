import {
  getApiDocsUrl,
  getApiHealthUrl,
  getApiOpenApiUrl,
  getApiOrigin,
} from "@/lib/api/api-origin";

export function GET() {
  const anchor = getApiOrigin();

  const body = {
    linkset: [
      {
        anchor,
        "service-desc": [
          {
            href: getApiOpenApiUrl(),
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: getApiDocsUrl(),
            type: "text/html",
          },
        ],
        status: [
          {
            href: getApiHealthUrl(),
            type: "application/json",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
