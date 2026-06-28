"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentUser,
  logout,
  updateCurrentUser,
  type UpdateUserBody,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { ApiUser } from "@/lib/api/types/user";
import { queryKeys } from "@/lib/api/query-keys";

export function useCurrentUser() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.currentUser,
    enabled: isLoaded && isSignedIn,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === "ACCOUNT_DELETED") {
        return false;
      }
      if (error instanceof Error && error.message === "Not authenticated") {
        return failureCount < 5;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => 300 * (attempt + 1),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchCurrentUser(token);
    },
  });
}

export function useUpdateCurrentUser() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiUser, Error, UpdateUserBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateCurrentUser(token, body);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.currentUser, user);
    },
  });
}

export function useLogout() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) return { success: true };
      return logout(token);
    },
  });
}

export function getUserDisplayName(user?: ApiUser | null) {
  if (!user) return "Account";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email;
}

export function getUserInitials(user?: ApiUser | null) {
  if (!user) return "?";
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  if (initials) return initials;
  return user.email[0]?.toUpperCase() ?? "?";
}

export function getUserFirstName(user?: ApiUser | null) {
  if (!user) return null;
  if (user.firstName?.trim()) return user.firstName.trim();
  const display = getUserDisplayName(user);
  return display.split(/\s+/)[0] ?? display;
}
