"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/api/use-auth-api";
import { DocumentPurpose, getProfileImageAccept } from "@/lib/documents/constants";
import { uploadDocument } from "@/lib/documents/upload-document";
import { validateFileForPurpose } from "@/lib/documents/validate-file";
import { PUBLISHING_SETTING_FIELDS } from "@/lib/form-options";
import { queryKeys } from "@/lib/api/query-keys";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";
import {
  joinFullName,
  resolveUserDisplayName,
  splitFullName,
  userInitials,
} from "@/lib/user-display";
import type { ApiUser } from "@/lib/api/client";
import { useAppUi } from "@/providers/app-ui-provider";

type NotificationKey = keyof ApiUser["notifications"];

const NOTIFICATION_TOGGLES: Array<{
  key: NotificationKey;
  label: string;
  desc: string;
}> = [
  {
    key: "weeklyReminders",
    label: "Weekly content reminders",
    desc: "A nudge when it's time to plan your week.",
  },
  {
    key: "generationComplete",
    label: "Generation complete",
    desc: "Email me when my posts are ready.",
  },
  {
    key: "productUpdates",
    label: "Product updates",
    desc: "New features and tips from linkedinpost.ai.",
  },
];

export default function Settings() {
  const bypass = isAuthBypassEnabled();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const { data: apiUser, isLoading } = useCurrentUser();
  const updateUser = useUpdateCurrentUser();

  const {
    linkedinConnected,
    linkedInProfileName,
    openConnect,
    disconnectLinkedIn,
    confirmLogout,
    confirmDeleteAccount,
    showToast,
  } = useAppUi();

  const [fullName, setFullName] = useState("Maya Reyes");
  const [email, setEmail] = useState("maya@northbeam.co");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bypass || !apiUser) return;

    setFullName(
      joinFullName(apiUser.firstName, apiUser.lastName) ||
        clerkUser?.fullName ||
        apiUser.email,
    );
    setEmail(apiUser.email);
  }, [apiUser, bypass, clerkUser?.fullName]);

  useEffect(() => {
    return () => {
      if (localPhotoPreview) URL.revokeObjectURL(localPhotoPreview);
    };
  }, [localPhotoPreview]);

  const displayName = bypass
    ? fullName
    : resolveUserDisplayName(apiUser) || fullName;
  const avatarInitials = userInitials(displayName, email);
  const profileImageUrl = bypass ? localPhotoPreview : apiUser?.profileImageUrl;
  const avatarSrc = localPhotoPreview ?? profileImageUrl;

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateFileForPurpose(file, DocumentPurpose.PROFILE);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    if (bypass) {
      setLocalPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      showToast("Photo updated", "photo_camera");
      return;
    }

    setUploadingPhoto(true);
    try {
      const token = await getToken();
      if (!token) {
        showToast("Sign in to upload a photo", "error");
        return;
      }

      const { documentId } = await uploadDocument({
        token,
        file,
        purpose: DocumentPurpose.PROFILE,
      });

      await updateUser.mutateAsync({ profileDocumentId: documentId });

      try {
        await clerkUser?.setProfileImage({ file });
      } catch {
        // Backend profile image is source of truth.
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      showToast("Photo updated", "photo_camera");
    } catch {
      showToast("Could not upload photo. Try again.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAccount = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      showToast("Enter your full name", "error");
      return;
    }

    if (bypass) {
      showToast("Changes saved", "check_circle");
      return;
    }

    const { firstName, lastName } = splitFullName(trimmed);

    try {
      await updateUser.mutateAsync({ firstName, lastName });

      try {
        await clerkUser?.update({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        });
      } catch {
        // Backend profile is source of truth.
      }

      showToast("Changes saved", "check_circle");
    } catch {
      showToast("Could not save changes. Try again.", "error");
    }
  };

  const toggleNotification = async (key: NotificationKey) => {
    if (bypass) {
      showToast("Notification settings updated", "notifications");
      return;
    }

    if (!apiUser || updateUser.isPending) return;

    const nextValue = !apiUser.notifications[key];

    try {
      await updateUser.mutateAsync({
        notifications: { [key]: nextValue },
      });
      showToast("Notification settings updated", "notifications");
    } catch {
      showToast("Could not update notifications. Try again.", "error");
    }
  };

  const savingAccount = updateUser.isPending && !uploadingPhoto;
  const accountDisabled = isLoading || savingAccount || uploadingPhoto;

  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Account</h2>

        <div className="mt-4 mb-5 flex flex-wrap items-center gap-4">
          <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#fb7185] to-[#f43f5e]">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-white">
                {avatarInitials}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept={getProfileImageAccept()}
              className="sr-only"
              onChange={(e) => void handlePhotoPick(e)}
            />
            <Button
              type="button"
              variant="muted"
              size="sm"
              className="rounded-[10px] px-[15px]"
              disabled={uploadingPhoto || isLoading}
              onClick={() => photoInputRef.current?.click()}
            >
              <MsIcon name="photo_camera" size={17} className="text-[#64748b]" />
              {uploadingPhoto
                ? "Uploading…"
                : avatarSrc
                  ? "Change photo"
                  : "Upload photo"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={accountDisabled}
          />
          <InputField
            label="Email"
            type="email"
            value={email}
            disabled
            aria-disabled
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="rounded-[10px] px-[18px] py-2.5 text-[13.5px]"
            disabled={accountDisabled}
            onClick={() => void handleSaveAccount()}
          >
            {savingAccount ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Connections</h2>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#eceef4] bg-[#f8f9fc] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a66c2] font-display text-sm font-extrabold text-white">
              in
            </div>
            <div>
              <div className="text-sm font-semibold">LinkedIn</div>
              <div className="text-xs text-[#94a3b8]">
                {linkedinConnected
                  ? `Connected as ${linkedInProfileName ?? "LinkedIn member"}`
                  : "Not connected"}
              </div>
            </div>
          </div>
          {linkedinConnected ? (
            <Button type="button" variant="muted" size="xs" onClick={disconnectLinkedIn}>
              Disconnect
            </Button>
          ) : (
            <Button type="button" variant="linkedin" size="xs" onClick={openConnect}>
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">LinkedIn publishing</h2>
        {!linkedinConnected ? (
          <div className="mt-3 flex items-center gap-2 rounded-[11px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[13px] text-[#92400e]">
            <MsIcon name="warning" size={18} />
            Connect LinkedIn to enable publishing and scheduling.
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {PUBLISHING_SETTING_FIELDS.map((field) => (
            <SelectField
              key={field.label}
              label={field.label}
              options={field.options}
              defaultValue={field.default}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Notifications</h2>
        <div className="mt-4 space-y-4">
          {NOTIFICATION_TOGGLES.map(({ key, label, desc }) => {
            const on = bypass
              ? key !== "productUpdates"
              : (apiUser?.notifications[key] ?? false);

            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-[#94a3b8]">{desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={isLoading || updateUser.isPending || (!bypass && !apiUser)}
                  onClick={() => void toggleNotification(key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    on ? "bg-[#4f46e5]" : "bg-[#cbd5e1]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      on ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Session</h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Sign out of linkedinpost.ai on this device.
        </p>
        <Button
          type="button"
          variant="muted"
          size="sm"
          className="mt-4 rounded-[10px] px-[15px]"
          onClick={confirmLogout}
        >
          <MsIcon name="logout" size={17} className="text-[#64748b]" />
          Log out
        </Button>
      </div>

      <div className="rounded-2xl border border-[#f3d8d8] bg-[#fef2f2]/40 p-6">
        <h2 className="font-display text-lg font-bold text-[#991b1b]">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-[#b91c1c]/80">
          Permanently delete your account and all content.
        </p>
        <Button
          type="button"
          variant="destructive-outline"
          size="sm"
          className="mt-3 bg-white"
          onClick={confirmDeleteAccount}
        >
          Delete account
        </Button>
      </div>
    </div>
  );
}
