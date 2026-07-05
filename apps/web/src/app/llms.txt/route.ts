import { buildLlmsTxt } from "@/lib/agent/llms-txt";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
