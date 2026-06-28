import type { QueryClient } from "@tanstack/react-query";

export function invalidateNotificationQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
}
