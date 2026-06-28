import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiLinkedInConnectionStatus,
  ApiLinkedInProfile,
} from "@/lib/api/types/linkedin";

export async function fetchLinkedInConnection(
  token: string,
): Promise<ApiLinkedInConnectionStatus> {
  return apiFetch<ApiLinkedInConnectionStatus>(token, "/linkedin/connection");
}

export async function fetchLinkedInProfile(
  token: string,
): Promise<ApiLinkedInProfile | null> {
  return apiFetch<ApiLinkedInProfile | null>(token, "/linkedin/profile");
}

export async function syncLinkedInProfile(
  token: string,
): Promise<ApiLinkedInProfile> {
  return apiFetch<ApiLinkedInProfile>(token, "/linkedin/profile/sync", {
    method: "POST",
  });
}
