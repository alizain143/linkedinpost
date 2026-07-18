import { apiFetch } from "@/lib/api/fetch";
import type { ApiUser } from "@/lib/api/types/user";
import type { UserPlan } from "@/lib/api/types/enums";

export type { ApiUser, UserNotificationPrefs } from "@/lib/api/types/user";

export async function fetchCurrentUser(token: string): Promise<ApiUser> {
  return apiFetch<ApiUser>(token, "/auth/me");
}

export async function logout(token: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(token, "/auth/logout", {
    method: "POST",
    body: "{}",
  });
}

export type UpdateUserBody = Partial<
  Pick<
    ApiUser,
    "firstName" | "lastName" | "timezone" | "profileDocumentId"
  > & {
    notifications: Partial<ApiUser["notifications"]>;
    markTourSeen: string;
    lastAcknowledgedPlan: UserPlan;
  }
>;

export async function updateCurrentUser(
  token: string,
  body: UpdateUserBody,
): Promise<ApiUser> {
  return apiFetch<ApiUser>(token, "/auth/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
