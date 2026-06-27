import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBaseUrl, authHeaders, parseApiResponse } from "@/lib/api/client";

export type LinkedInConnectionStatus = {
  connected: boolean;
  publishReady: boolean;
  profileName: string | null;
  approvedScopes: string[];
  linkedInMemberId: string | null;
};

export type LinkedInPositionSummary = {
  title: string | null;
  companyName: string | null;
  companyPageUrl: string | null;
  startedOn: { month?: number; year?: number } | null;
  isCurrent: boolean;
};

export type LinkedInProfile = {
  memberId: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  pictureUrl: string | null;
  headline: string | null;
  summary: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  profileUrl: string | null;
  locale: string | null;
  positions: LinkedInPositionSummary[];
  education: Array<{
    schoolName: string | null;
    degreeName: string | null;
    fieldOfStudy: string | null;
  }>;
  syncedAt: string;
};

async function fetchWithAuth<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers ?? {}),
    },
  });
  return parseApiResponse<T>(response);
}

export function useLinkedInConnection() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["linkedin", "connection"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return null;
      return fetchWithAuth<LinkedInConnectionStatus>(
        "/linkedin/connection",
        token,
      );
    },
  });
}

export function useLinkedInProfile() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["linkedin", "profile"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return null;
      return fetchWithAuth<LinkedInProfile | null>("/linkedin/profile", token);
    },
  });
}

export function useSyncLinkedInProfile() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth<LinkedInProfile>("/linkedin/profile/sync", token, {
        method: "POST",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["linkedin"] });
    },
  });
}
