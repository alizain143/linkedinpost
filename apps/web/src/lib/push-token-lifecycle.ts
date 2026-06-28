import { revokePushDevice } from "@/lib/api/notifications";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { requestFcmToken } from "@/lib/firebase/messaging";
import { clearPersistedFcmToken } from "@/lib/push-token-storage";

export async function revokeCurrentPushToken(
  getAuthToken: () => Promise<string | null>,
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const authToken = await getAuthToken();
  if (!authToken) return;

  const fcmToken = await requestFcmToken();
  if (!fcmToken) return;

  await revokePushDevice(authToken, fcmToken);
  clearPersistedFcmToken();
}
