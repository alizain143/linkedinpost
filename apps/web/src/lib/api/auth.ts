import {
  apiBaseUrl,
  authHeaders,
  parseApiResponse,
  type ApiUser,
} from "@/lib/api/client";

export async function fetchCurrentUser(token: string): Promise<ApiUser> {
  const response = await fetch(`${apiBaseUrl()}/auth/me`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(token),
    },
  });
  return parseApiResponse<ApiUser>(response);
}

export async function logout(token: string): Promise<{ success: boolean }> {
  const response = await fetch(`${apiBaseUrl()}/auth/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: "{}",
  });
  return parseApiResponse<{ success: boolean }>(response);
}

export type UpdateUserBody = Partial<
  Pick<
    ApiUser,
    "firstName" | "lastName" | "timezone" | "profileDocumentId"
  > & {
    notifications: Partial<ApiUser["notifications"]>;
  }
>;

export async function updateCurrentUser(
  token: string,
  body: UpdateUserBody,
): Promise<ApiUser> {
  const response = await fetch(`${apiBaseUrl()}/auth/me`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(body),
  });
  return parseApiResponse<ApiUser>(response);
}
