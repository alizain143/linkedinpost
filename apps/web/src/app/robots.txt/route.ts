import { buildRobotsTxt } from "@/lib/seo/robots-txt";

export function GET() {
  const body = buildRobotsTxt();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
