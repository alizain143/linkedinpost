"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import {
  ImportProfileFlowModal,
  type ImportProfileFlowStep,
} from "@/components/modals/import-profile-flow-modal";
import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/api/use-auth-api";
import {
  useCreateLinkedInImportToken,
  useImportLinkedInProfile,
  useLinkedInProfile,
  useSyncLinkedInProfile,
} from "@/hooks/api/use-linkedin-api";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { ApiError } from "@/lib/api/client";
import {
  extractLinkedInProfileSlug,
  isUsableLinkedInProfileUrl,
} from "@/lib/linkedin-profile-url";
import { DocumentPurpose, getProfileImageAccept } from "@/lib/documents/constants";
import { uploadDocument } from "@/lib/documents/upload-document";
import { validateFileForPurpose } from "@/lib/documents/validate-file";
import { queryKeys } from "@/lib/api/query-keys";
import {
  joinFullName,
  resolveUserDisplayName,
  splitFullName,
  userInitials,
} from "@/lib/user-display";
import {
  DEFAULT_TIMEZONE,
  TIMEZONE_OPTIONS,
  isKnownTimezone,
} from "@/lib/timezones";
import type { ApiUser } from "@/lib/api/client";
import { LINKEDIN_IMPORT_REVIEW_PARAM, LINKEDIN_IMPORT_SESSION_KEY } from "@/lib/api/types/linkedin";
import { apiBaseUrl } from "@/lib/api/client-core";
import {
  buildImportReturnUrl,
  clearStagedImportSession,
  LINKEDIN_STAGED_IMPORT_READY_EVENT,
  pingLinkedInExtension,
  readImportExpectedSlug,
  readStagedImportFromSession,
  setImportExpectedSlug,
  stageImportPreview,
  stagedImportToPayload,
  startLinkedInImportSession,
  subscribeLinkedInImportPreview,
  subscribeLinkedInImportExtractError,
  type LinkedInImportPreview,
} from "@/lib/linkedin-extension-bridge";
import {
  isExternalExtensionInstallUrl,
  linkedInExtensionInstallUrl,
} from "@/lib/linkedin-extension-config";
import {
  getLinkedInProfileSubtitle,
  getLinkedInStatusDescription,
  getLinkedInStatusLabel,
  needsLinkedInProfileImport,
} from "@/lib/linkedin-utils";
import { useAppUi } from "@/providers/app-ui-provider";
import { useTour } from "@/providers/tour-provider";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  useUpdateWorkspaceSettings,
  useWorkspaceDetail,
} from "@/hooks/api/use-workspaces-api";
import type { ChangesApplyMode } from "@/lib/api/types/enums";

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
    key: "publishAlerts",
    label: "Publish alerts",
    desc: "Email me when posts publish or fail.",
  },
  {
    key: "productUpdates",
    label: "Product updates",
    desc: "New features and tips from linkedinpost.ai.",
  },
];

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      <div className="h-64 animate-pulse rounded-2xl bg-[#eceef4]" />
      <div className="h-32 animate-pulse rounded-2xl bg-[#eceef4]" />
      <div className="h-48 animate-pulse rounded-2xl bg-[#eceef4]" />
    </div>
  );
}

export default function Settings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const {
    data: apiUser,
    isLoading,
    error: userError,
    refetch,
  } = useCurrentUser();
  const updateUser = useUpdateCurrentUser();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  const {
    linkedinConnected,
    linkedInProfileName,
    linkedinConnectionState,
    openConnect,
    disconnectLinkedIn,
    confirmLogout,
    confirmDeleteAccount,
    showToast,
  } = useAppUi();
  const { startProductTour } = useTour();
  const { data: linkedInProfile, refetch: refetchLinkedInProfile } =
    useLinkedInProfile(activeWorkspaceId);
  const syncLinkedInProfile = useSyncLinkedInProfile(activeWorkspaceId);
  const createImportToken = useCreateLinkedInImportToken(activeWorkspaceId);
  const importLinkedInProfile = useImportLinkedInProfile(activeWorkspaceId);
  const importTokenRef = useRef<string | null>(null);
  const importExpectedSlugRef = useRef<string | null>(null);
  const importPreviewAppliedRef = useRef(false);
  const importPreviewRef = useRef<LinkedInImportPreview | null>(null);
  const applyStagedPreviewRef = useRef<(preview: LinkedInImportPreview) => void>(
    () => {},
  );
  const [importFlowOpen, setImportFlowOpen] = useState(false);
  const [importFlowStep, setImportFlowStep] =
    useState<ImportProfileFlowStep>("checking");
  const [importFlowError, setImportFlowError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<LinkedInImportPreview | null>(
    null,
  );
  const [importProfileUrlInput, setImportProfileUrlInput] = useState("");
  const linkedInProfileSubtitle = getLinkedInProfileSubtitle(linkedInProfile);
  const showImportPrompt =
    linkedinConnected && needsLinkedInProfileImport(linkedInProfile);

  const applyStagedPreview = useCallback(
    (preview: LinkedInImportPreview) => {
      const previewSlug = extractLinkedInProfileSlug(preview.profileUrl ?? "");
      const expectedSlug =
        importExpectedSlugRef.current ?? readImportExpectedSlug();
      const currentSlug = importPreviewRef.current
        ? extractLinkedInProfileSlug(importPreviewRef.current.profileUrl ?? "")
        : null;
      const slugMismatch =
        Boolean(expectedSlug && previewSlug && previewSlug !== expectedSlug);

      if (slugMismatch) {
        sessionStorage.removeItem(LINKEDIN_IMPORT_SESSION_KEY);
        return;
      }

      if (importPreviewAppliedRef.current) {
        const canOverrideStale =
          Boolean(expectedSlug && previewSlug === expectedSlug) &&
          currentSlug !== expectedSlug;
        if (!canOverrideStale) return;
      }

      importPreviewAppliedRef.current = true;
      importPreviewRef.current = preview;
      setImportPreview(preview);
      setImportFlowStep("preview");
      setImportFlowOpen(true);
      stageImportPreview(preview);

      if (searchParams.get(LINKEDIN_IMPORT_REVIEW_PARAM) === "1") {
        const url = new URL(window.location.href);
        url.searchParams.delete(LINKEDIN_IMPORT_REVIEW_PARAM);
        window.history.replaceState(null, "", url.pathname + url.search);
      }
    },
    [searchParams],
  );

  applyStagedPreviewRef.current = applyStagedPreview;

  useEffect(() => {
    const reviewParam = searchParams.get(LINKEDIN_IMPORT_REVIEW_PARAM);
    if (reviewParam !== "1") return;
    if (importPreviewAppliedRef.current) return;

    setImportFlowOpen(true);
    setImportFlowStep("extracting");
    setImportFlowError(null);
    let cancelled = false;

    function tryApply() {
      if (cancelled || importPreviewAppliedRef.current) return true;
      const staged = readStagedImportFromSession();
      if (staged) {
        applyStagedPreviewRef.current(staged);
        return importPreviewAppliedRef.current;
      }
      return false;
    }

    if (tryApply()) return;

    function onStagedReady(event: Event) {
      const detail = (event as CustomEvent<LinkedInImportPreview>).detail;
      if (detail && !cancelled && !importPreviewAppliedRef.current) {
        applyStagedPreviewRef.current(detail);
        return;
      }
      tryApply();
    }

    window.addEventListener(LINKEDIN_STAGED_IMPORT_READY_EVENT, onStagedReady);

    const interval = window.setInterval(() => {
      if (tryApply()) window.clearInterval(interval);
    }, 150);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      if (!cancelled && !importPreviewAppliedRef.current) {
        setImportFlowStep("error");
        setImportFlowError(
          "Profile extraction timed out. Try again or check that the backend is running.",
        );
      }
    }, 120_000);

    return () => {
      cancelled = true;
      window.removeEventListener(
        LINKEDIN_STAGED_IMPORT_READY_EVENT,
        onStagedReady,
      );
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [searchParams]);

  useEffect(() => {
    return subscribeLinkedInImportExtractError(({ error }) => {
      if (importPreviewAppliedRef.current) return;
      setImportFlowOpen(true);
      setImportFlowStep("error");
      setImportFlowError(error);
    });
  }, []);

  useEffect(() => {
    return subscribeLinkedInImportPreview(({ preview }) => {
      applyStagedPreviewRef.current(preview);
    });
  }, []);

  const handleCancelImport = useCallback(() => {
    importPreviewAppliedRef.current = false;
    importPreviewRef.current = null;
    setImportFlowOpen(false);
    setImportPreview(null);
    setImportFlowError(null);
    setImportProfileUrlInput("");
    clearStagedImportSession();
    importTokenRef.current = null;
    importExpectedSlugRef.current = null;
    createImportToken.reset();
  }, [createImportToken]);

  const executeImportProfileFlow = useCallback(
    async (profileUrl: string) => {
      if (!activeWorkspaceId) return;

      setImportFlowError(null);
      setImportFlowStep("preparing");

      try {
        const tokenData = await createImportToken.mutateAsync({ profileUrl });
        importTokenRef.current = tokenData.token;
        importExpectedSlugRef.current =
          tokenData.expectedProfileSlug?.toLowerCase() ?? null;
        setImportExpectedSlug(importExpectedSlugRef.current);
        setImportFlowStep("opening");

        const started = await startLinkedInImportSession({
          importToken: tokenData.token,
          workspaceId: activeWorkspaceId,
          apiBase: apiBaseUrl(),
          linkedInUrl: tokenData.linkedInImportUrl,
          returnUrl: buildImportReturnUrl(),
          expectedProfileSlug: tokenData.expectedProfileSlug,
          profileName: tokenData.profileName,
        });

        if (!started.ok) {
          throw new Error(started.error ?? "Could not open LinkedIn import session");
        }

        setImportFlowStep("waiting");
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === "LINKEDIN_IMPORT_PROFILE_URL_UNKNOWN"
        ) {
          setImportFlowStep("profile-url");
          setImportFlowError(
            profileUrl.trim()
              ? "Could not use that profile URL. Check the link and try again."
              : null,
          );
          return;
        }
        setImportFlowStep("error");
        setImportFlowError(
          getApiErrorMessage(error, "Could not start profile import."),
        );
      }
    },
    [activeWorkspaceId, createImportToken],
  );

  const handleProfileUrlContinue = useCallback(() => {
    const profileUrl = importProfileUrlInput.trim();
    if (!profileUrl.includes("linkedin.com/in/")) {
      setImportFlowError("Enter a valid LinkedIn profile URL (linkedin.com/in/...).");
      return;
    }
    void executeImportProfileFlow(profileUrl);
  }, [executeImportProfileFlow, importProfileUrlInput]);

  const runImportProfileFlow = useCallback(async () => {
    if (!activeWorkspaceId) return;

    setImportFlowOpen(true);
    setImportFlowError(null);
    setImportPreview(null);
    importPreviewAppliedRef.current = false;
    importPreviewRef.current = null;
    importTokenRef.current = null;
    importExpectedSlugRef.current = null;
    clearStagedImportSession();
    setImportFlowStep("checking");
    createImportToken.reset();

    const hasExtension = await pingLinkedInExtension();
    if (!hasExtension) {
      const staleBridge =
        document.documentElement.getAttribute("data-linkedinpost-extension") ===
        "1";
      if (staleBridge) {
        setImportFlowStep("error");
        setImportFlowError(
          "Extension was updated. Refresh this page and try Import profile again.",
        );
        return;
      }

      setImportFlowOpen(false);
      const installUrl = linkedInExtensionInstallUrl();
      if (isExternalExtensionInstallUrl(installUrl)) {
        window.location.href = installUrl;
      } else {
        router.push(installUrl);
      }
      return;
    }

    const storedProfileUrl = linkedInProfile?.profileUrl?.trim() ?? "";
    if (isUsableLinkedInProfileUrl(storedProfileUrl)) {
      await executeImportProfileFlow(storedProfileUrl);
      return;
    }

    setImportProfileUrlInput("");
    setImportFlowStep("profile-url");
  }, [
    activeWorkspaceId,
    createImportToken,
    executeImportProfileFlow,
    linkedInProfile?.profileUrl,
    router,
  ]);

  const handleSaveImport = useCallback(async () => {
    if (!importPreview?.profileUrl || !activeWorkspaceId) {
      showToast("Profile URL is missing from import", "error");
      return;
    }

    setImportFlowStep("saving");
    setImportFlowError(null);

    try {
      await importLinkedInProfile.mutateAsync({
        ...stagedImportToPayload(importPreview),
        importToken: importTokenRef.current ?? undefined,
      });
      showToast("Profile saved", "save");
      handleCancelImport();
      void refetchLinkedInProfile();
    } catch (error) {
      setImportFlowStep("error");
      setImportFlowError(
        getApiErrorMessage(error, "Could not save imported profile."),
      );
    }
  }, [
    activeWorkspaceId,
    handleCancelImport,
    importLinkedInProfile,
    importPreview,
    refetchLinkedInProfile,
    showToast,
  ]);

  const { enablePush, disablePush, permission, isConfigured } =
    usePushNotifications();
  const { data: workspaceDetail } = useWorkspaceDetail(activeWorkspaceId);
  const updateWorkspaceSettings = useUpdateWorkspaceSettings();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apiUser) return;

    setFullName(
      joinFullName(apiUser.firstName, apiUser.lastName) ||
        clerkUser?.fullName ||
        apiUser.email,
    );
    setEmail(apiUser.email);
    setTimezone(
      isKnownTimezone(apiUser.timezone) ? apiUser.timezone : DEFAULT_TIMEZONE,
    );
  }, [apiUser, clerkUser?.fullName]);

  const displayName = resolveUserDisplayName(apiUser) || fullName;
  const avatarInitials = userInitials(displayName, email);
  const profileImageUrl = apiUser?.profileImageUrl;
  const avatarSrc = profileImageUrl;

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateFileForPurpose(file, DocumentPurpose.PROFILE);
    if (validationError) {
      showToast(validationError, "error");
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
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not upload photo. Try again."), "error");
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
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not save changes. Try again."), "error");
    }
  };

  const handleTimezoneChange = async (value: string) => {
    setTimezone(value);

    if (!apiUser || updateUser.isPending) return;

    try {
      await updateUser.mutateAsync({ timezone: value });
      showToast("Timezone updated", "schedule");
    } catch (error) {
      setTimezone(
        isKnownTimezone(apiUser.timezone) ? apiUser.timezone : DEFAULT_TIMEZONE,
      );
      showToast(
        getApiErrorMessage(error, "Could not update timezone. Try again."),
        "error",
      );
    }
  };

  const toggleNotification = async (key: NotificationKey) => {
    if (!apiUser || updateUser.isPending) return;

    const nextValue = !apiUser.notifications[key];

    try {
      await updateUser.mutateAsync({
        notifications: { [key]: nextValue },
      });
      showToast("Notification settings updated", "notifications");
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Could not update notifications. Try again."),
        "error",
      );
    }
  };

  const savingAccount = updateUser.isPending && !uploadingPhoto;
  const accountDisabled = isLoading || savingAccount || uploadingPhoto;

  return (
    <QueryState
      isLoading={isLoading}
      error={userError}
      onRetry={() => void refetch()}
      skeleton={<SettingsSkeleton />}
    >
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
                disabled={uploadingPhoto || accountDisabled}
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

          <div className="mt-4" data-tour="settings-account-timezone">
            <SelectField
              label="Timezone"
              hint="used for calendar and scheduling"
              value={timezone}
              options={TIMEZONE_OPTIONS}
              disabled={accountDisabled || updateUser.isPending}
              onChange={(e) => void handleTimezoneChange(e.target.value)}
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
          <div className="mt-4 overflow-hidden rounded-xl border border-[#eceef4] bg-[#f8f9fc]">
            <div className="p-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0a66c2] font-display text-sm font-extrabold text-white">
                  in
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-[#0f172a]">
                      LinkedIn
                    </span>
                    {linkedinConnected ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          linkedinConnectionState === "publishReady"
                            ? "bg-[#dcfce7] text-[#166534]"
                            : "bg-[#fef3c7] text-[#92400e]"
                        }`}
                      >
                        {getLinkedInStatusLabel(linkedinConnectionState)}
                      </span>
                    ) : null}
                    {linkedinConnected && !showImportPrompt ? (
                      <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                        Profile imported
                      </span>
                    ) : null}
                    {linkedinConnected && showImportPrompt ? (
                      <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-semibold text-[#92400e]">
                        Basic profile
                      </span>
                    ) : null}
                  </div>

                  {linkedinConnectionState === "disconnected" ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-[#64748b]">
                      {activeWorkspace?.type === "client"
                        ? "Connect this client's LinkedIn to schedule and publish posts for their workspace."
                        : getLinkedInStatusDescription(
                            linkedinConnectionState,
                            linkedInProfileName,
                          )}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[#64748b]">
                      {linkedInProfileName
                        ? `Connected as ${linkedInProfileName}`
                        : "LinkedIn account connected"}
                    </p>
                  )}

                  {linkedInProfileSubtitle ? (
                    <p className="mt-0.5 text-xs font-medium text-[#475569]">
                      {linkedInProfileSubtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              {showImportPrompt ? (
                <div className="mt-4 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3">
                  <p className="text-xs leading-relaxed text-[#92400e]">
                    Import headline, About, and experience for better AI content
                    and templates. Click <strong>Import profile</strong> below.
                    {activeWorkspace?.type === "client" ? (
                      <>
                        {" "}
                        Your client should install the extension and import from
                        their own LinkedIn session.
                      </>
                    ) : null}
                  </p>
                </div>
              ) : null}
            </div>

            {linkedinConnected ? (
              <div className="flex flex-col gap-2 border-t border-[#eceef4] bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    data-tour="settings-linkedin-import"
                    onClick={() => void runImportProfileFlow()}
                  >
                    Import profile
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={syncLinkedInProfile.isPending}
                    onClick={() => {
                      void syncLinkedInProfile
                        .mutateAsync()
                        .then(() =>
                          showToast("LinkedIn profile refreshed", "sync"),
                        )
                        .catch((err) =>
                          showToast(getApiErrorMessage(err), "error"),
                        );
                    }}
                  >
                    {syncLinkedInProfile.isPending
                      ? "Refreshing…"
                      : "Refresh API data"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="linkedin"
                    size="xs"
                    onClick={openConnect}
                  >
                    Switch account
                  </Button>
                  <Button
                    type="button"
                    variant="destructive-outline"
                    size="xs"
                    onClick={disconnectLinkedIn}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-[#eceef4] bg-white/60 px-4 py-3">
                <Button
                  type="button"
                  variant="linkedin"
                  size="xs"
                  data-tour="settings-linkedin-connect"
                  onClick={openConnect}
                >
                  Connect LinkedIn
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
          <h2 className="font-display text-lg font-bold">Workflow</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            How this workspace handles approval feedback. Public share-link
            auto-apply charges the workspace owner.
          </p>
          <div className="mt-4 space-y-3">
            {(
              [
                {
                  value: "review_first" as ChangesApplyMode,
                  label: "Review feedback first",
                  desc: "Changes land on the Changes tab. You choose when to apply AI.",
                },
                {
                  value: "auto_apply" as ChangesApplyMode,
                  label: "Apply changes with AI automatically",
                  desc: "When changes are requested, AI revises the post immediately (1 credit).",
                },
              ] as const
            ).map((option) => {
              const active =
                (workspaceDetail?.changesApplyMode ?? "review_first") ===
                option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-[12px] border p-3 ${
                    active
                      ? "border-[#4f46e5] bg-[#eef2ff]"
                      : "border-[#e3e6ef] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="changesApplyMode"
                    className="mt-1"
                    checked={active}
                    disabled={
                      !activeWorkspaceId || updateWorkspaceSettings.isPending
                    }
                    onChange={() => {
                      if (!activeWorkspaceId) return;
                      void updateWorkspaceSettings
                        .mutateAsync({
                          workspaceId: activeWorkspaceId,
                          body: { changesApplyMode: option.value },
                        })
                        .then(() =>
                          showToast("Workflow preference saved", "check_circle"),
                        )
                        .catch((err) =>
                          showToast(getApiErrorMessage(err), "error"),
                        );
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#1e293b]">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#64748b]">
                      {option.desc}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
          <h2 className="font-display text-lg font-bold">Notifications</h2>
          <div className="mt-4 space-y-4">
            {NOTIFICATION_TOGGLES.map(({ key, label, desc }) => {
              const on = apiUser?.notifications[key] ?? false;

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
                    disabled={accountDisabled || !apiUser}
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

          <div className="mt-6 border-t border-[#f1f3f8] pt-5">
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Browser notifications
            </h3>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Get real-time alerts in your browser when you are signed in.
            </p>
            {!isConfigured ? (
              <p className="mt-3 text-xs text-[#94a3b8]">
                Push is not configured for this environment.
              </p>
            ) : permission === "denied" ? (
              <p className="mt-3 text-xs text-[#d97706]">
                Notifications are blocked in your browser. Enable them in site
                settings to receive push alerts.
              </p>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Push notifications</div>
                  <div className="text-xs text-[#94a3b8]">
                    Approvals, generation, and publish updates.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={apiUser?.notifications.pushEnabled ?? false}
                  disabled={accountDisabled || !apiUser}
                  onClick={() => {
                    const enabled = apiUser?.notifications.pushEnabled ?? false;
                    void (enabled ? disablePush() : enablePush());
                  }}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    apiUser?.notifications.pushEnabled
                      ? "bg-[#4f46e5]"
                      : "bg-[#cbd5e1]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      apiUser?.notifications.pushEnabled
                        ? "left-[22px]"
                        : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
          <h2 className="font-display text-lg font-bold">Help</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Replay the product walkthrough covering dashboard, generate,
            profile, calendar, and billing.
          </p>
          <Button
            type="button"
            variant="muted"
            size="sm"
            className="mt-4 rounded-[10px] px-[15px]"
            data-tour="settings-replay-tour"
            onClick={startProductTour}
          >
            <MsIcon name="touch_app" size={17} className="text-[#64748b]" />
            Replay product tour
          </Button>
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

      <ImportProfileFlowModal
        open={importFlowOpen}
        step={importFlowStep}
        errorMessage={importFlowError}
        preview={importPreview}
        profileUrlInput={importProfileUrlInput}
        connectedProfileName={linkedInProfileName}
        onProfileUrlChange={setImportProfileUrlInput}
        onProfileUrlContinue={handleProfileUrlContinue}
        onCancel={handleCancelImport}
        onSave={() => void handleSaveImport()}
        onReimport={() => void runImportProfileFlow()}
        onRetry={() => void runImportProfileFlow()}
      />
    </QueryState>
  );
}
