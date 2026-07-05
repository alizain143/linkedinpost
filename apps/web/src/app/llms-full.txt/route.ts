import { buildLlmsFullTxt } from "@/lib/agent/llms-txt";

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
