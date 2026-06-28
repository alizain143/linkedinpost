import { apiFetch } from "@/lib/api/fetch";
import type { ApiCreditsBalance } from "@/lib/api/types/credits";

export async function fetchCredits(token: string): Promise<ApiCreditsBalance> {
  return apiFetch<ApiCreditsBalance>(token, "/credits");
}
