import type { QueryClient } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/api/auth";
import { queryKeys } from "@/lib/api/query-keys";

export async function syncCurrentUser(
  getToken: () => Promise<string | null>,
  queryClient?: QueryClient,
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const user = await fetchCurrentUser(token);
  queryClient?.setQueryData(queryKeys.currentUser, user);
}
