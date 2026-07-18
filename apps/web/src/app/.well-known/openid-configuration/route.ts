import { resolveClerkOidcDiscovery } from "@/lib/auth/clerk-discovery";

export async function GET() {
  const discovery = await resolveClerkOidcDiscovery();

  if (!discovery) {
    return Response.json(
      {
        error:
          "Clerk issuer not configured. Set NEXT_PUBLIC_CLERK_FRONTEND_API or NEXT_PUBLIC_CLERK_ISSUER.",
      },
      { status: 503 },
    );
  }

  return Response.json(discovery, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
