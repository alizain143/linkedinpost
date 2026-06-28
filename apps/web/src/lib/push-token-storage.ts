const FCM_TOKEN_STORAGE_KEY = "pp_registered_fcm_token";

export function readPersistedFcmToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writePersistedFcmToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function clearPersistedFcmToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
