import type { ApiUser } from "@/lib/api/client";

export function joinFullName(
  firstName?: string | null,
  lastName?: string | null,
) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function userInitials(
  displayName: string,
  email?: string | null,
) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function resolveUserDisplayName(user?: ApiUser | null) {
  if (!user) return "";
  return joinFullName(user.firstName, user.lastName) || user.email;
}
