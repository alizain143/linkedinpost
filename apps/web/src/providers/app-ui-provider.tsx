"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { ConnectLinkedInModal } from "@/components/modals/connect-linkedin-modal";
import { RequestChangesModal } from "@/components/modals/request-changes-modal";
import { ScheduleModal } from "@/components/modals/schedule-modal";
import { useCurrentUser, useLogout } from "@/hooks/api/use-auth-api";
import {
  useInvalidateLinkedIn,
  useLinkedInConnection,
} from "@/hooks/api/use-linkedin-api";
import {
  usePublishPostMutation,
  useReschedulePostMutation,
  useSchedulePostMutation,
} from "@/hooks/api/use-scheduling-api";
import { useLinkedInClerk } from "@/hooks/use-linkedin-clerk";
import { useWorkspace } from "@/hooks/use-workspace";
import { ApiError } from "@/lib/api/client";
import type {
  PublishTarget,
  ScheduleTarget,
} from "@/lib/api/types/scheduling";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { clerkErrorMessage } from "@/lib/auth/clerk";
import {
  LINKEDIN_CONNECT_CALLBACK,
  LINKEDIN_OAUTH_STRATEGY,
  LINKEDIN_PUBLISH_SCOPE,
} from "@/lib/auth/linkedin-clerk";
import {
  getLinkedInConnectionState,
  type LinkedInConnectionState,
} from "@/lib/linkedin-utils";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";
import { usePpToast } from "@/providers/pp-toast-provider";
import { useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext } from "react";

export type ConfirmTone = "danger" | "neutral";

export type ConfirmConfig = {
  icon: string;
  tone: ConfirmTone;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
};

type AppUiContextValue = {
  linkedinConnected: boolean;
  linkedinPublishReady: boolean;
  linkedInProfileName: string | null;
  linkedinConnectionState: LinkedInConnectionState;
  openConnect: () => void;
  disconnectLinkedIn: () => void;
  requireLinkedIn: (fn: () => void) => () => void;
  askConfirm: (cfg: ConfirmConfig) => void;
  openSchedule: (target?: ScheduleTarget) => void;
  openRequestChanges: () => void;
  showToast: (msg: string, icon?: string) => void;
  toastCopy: () => void;
  toastSave: () => void;
  toastSaved: () => void;
  toastScheduled: () => void;
  toastAddCal: () => void;
  toastPublished: () => void;
  confirmLogout: () => void;
  confirmDeleteAccount: () => void;
  confirmCancelPlan: () => void;
  confirmRemoveClient: (name: string, onConfirm: () => void) => void;
  confirmDeleteDraft: (title: string, onConfirm: () => void) => void;
  confirmDeleteContentProfile: (name: string, onConfirm: () => void) => void;
  confirmRejectPost: (
    title: string,
    onConfirm: (feedback?: string) => void,
  ) => void;
  confirmPauseAutopilot: (onPause: () => void) => void;
  confirmPublishNow: (target: PublishTarget) => void;
};

const AppUiContext = createContext<AppUiContextValue | null>(null);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = usePpToast();
  const { signOut } = useClerk();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const { activeWorkspaceId } = useWorkspace();
  const { data: currentUser } = useCurrentUser();
  const userTimezone = currentUser?.timezone ?? DEFAULT_TIMEZONE;

  const schedulePostMutation = useSchedulePostMutation(activeWorkspaceId);
  const reschedulePostMutation = useReschedulePostMutation(activeWorkspaceId);
  const publishPostMutation = usePublishPostMutation(activeWorkspaceId);

  const { connected, publishReady, profileName, externalAccount, user } =
    useLinkedInClerk();
  const { data: connection } = useLinkedInConnection();
  const invalidateLinkedIn = useInvalidateLinkedIn();

  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ScheduleTarget | null>(
    null,
  );
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [requestChangesFeedback, setRequestChangesFeedback] = useState("");

  const linkedinConnected = connection?.connected ?? connected;
  const linkedinPublishReady = connection?.publishReady ?? publishReady;
  const linkedInProfileName = connection?.profileName ?? profileName;
  const linkedinConnectionState = getLinkedInConnectionState(
    connection ?? {
      connected: linkedinConnected,
      publishReady: linkedinPublishReady,
      profileName: linkedInProfileName,
      approvedScopes: [],
      linkedInMemberId: null,
    },
  );

  const openConnect = useCallback(() => setShowConnect(true), []);
  const closeConnect = useCallback(() => {
    setShowConnect(false);
    setConnecting(false);
  }, []);

  const doConnectLinkedIn = useCallback(async () => {
    if (!user) {
      showToast("Sign in to connect LinkedIn", "link_off");
      return;
    }

    setConnecting(true);
    try {
      if (externalAccount && linkedinConnected && !linkedinPublishReady) {
        await externalAccount.reauthorize({
          additionalScopes: [LINKEDIN_PUBLISH_SCOPE],
          redirectUrl: LINKEDIN_CONNECT_CALLBACK,
        });
        return;
      }

      await user.createExternalAccount({
        strategy: LINKEDIN_OAUTH_STRATEGY,
        redirectUrl: LINKEDIN_CONNECT_CALLBACK,
        additionalScopes: [LINKEDIN_PUBLISH_SCOPE],
      });
    } catch (err) {
      setConnecting(false);
      showToast(clerkErrorMessage(err), "link_off");
    }
  }, [
    externalAccount,
    linkedinConnected,
    linkedinPublishReady,
    showToast,
    user,
  ]);

  const disconnectLinkedIn = useCallback(() => {
    setConfirm({
      icon: "link_off",
      tone: "danger",
      title: "Disconnect LinkedIn?",
      body: "Scheduled posts won't publish until you reconnect. Your drafts and calendar stay saved.",
      confirmLabel: "Disconnect",
      onConfirm: () => {
        if (!externalAccount) {
          showToast("LinkedIn is not connected", "link_off");
          return;
        }

        void externalAccount
          .destroy()
          .then(async () => {
            await user?.reload();
            invalidateLinkedIn();
            showToast("LinkedIn disconnected", "link_off");
          })
          .catch((err) => showToast(clerkErrorMessage(err), "link_off"));
      },
    });
  }, [externalAccount, invalidateLinkedIn, showToast, user]);

  const askConfirmInternal = useCallback((cfg: ConfirmConfig) => {
    setConfirm(cfg);
  }, []);

  const askConfirm = askConfirmInternal;
  const cancelConfirm = useCallback(() => setConfirm(null), []);
  const doConfirm = useCallback(() => {
    const c = confirm;
    setConfirm(null);
    c?.onConfirm();
  }, [confirm]);

  const requireLinkedIn = useCallback(
    (fn: () => void) => () => {
      if (linkedinPublishReady) fn();
      else openConnect();
    },
    [linkedinPublishReady, openConnect],
  );

  const openSchedule = useCallback(
    (target?: ScheduleTarget) => {
      if (!target) {
        showToast("Save a post first to schedule it", "event_busy");
        return;
      }
      if (!linkedinPublishReady) {
        openConnect();
        return;
      }
      setScheduleError(null);
      setScheduleTarget(target);
    },
    [linkedinPublishReady, openConnect, showToast],
  );

  const closeSchedule = useCallback(() => {
    setScheduleTarget(null);
    setScheduleError(null);
  }, []);

  const handleScheduleConfirm = useCallback(
    (scheduledAt: string) => {
      if (!scheduleTarget) return;

      const mutation =
        scheduleTarget.mode === "reschedule"
          ? reschedulePostMutation
          : schedulePostMutation;

      void mutation
        .mutateAsync({
          postId: scheduleTarget.postId,
          body: { scheduledAt },
        })
        .then(() => {
          closeSchedule();
          showToast("Post scheduled", "schedule");
        })
        .catch((err) => {
          const message = getApiErrorMessage(err);
          setScheduleError(message);
          if (
            err instanceof ApiError &&
            (err.code === "LINKEDIN_NOT_CONNECTED" ||
              err.code === "LINKEDIN_SCOPE_MISSING")
          ) {
            openConnect();
          }
        });
    },
    [
      closeSchedule,
      openConnect,
      reschedulePostMutation,
      schedulePostMutation,
      scheduleTarget,
      showToast,
    ],
  );

  const submitRequestChanges = useCallback(() => {
    setShowRequestChanges(false);
    setRequestChangesFeedback("");
    showToast("Revision sent to AI Council", "send");
  }, [showToast]);

  const openRequestChanges = useCallback(() => {
    setRequestChangesFeedback("");
    setShowRequestChanges(true);
  }, []);

  const toastCopy = useCallback(
    () => showToast("Copied to clipboard", "content_copy"),
    [showToast],
  );
  const toastSave = useCallback(
    () => showToast("Saved to drafts", "bookmark_added"),
    [showToast],
  );
  const toastSaved = useCallback(
    () => showToast("Changes saved", "check_circle"),
    [showToast],
  );
  const toastScheduled = useCallback(
    () => showToast("Post scheduled", "schedule"),
    [showToast],
  );
  const toastAddCal = useCallback(
    () => showToast("Added to your calendar", "event_available"),
    [showToast],
  );
  const toastPublished = useCallback(
    () => showToast("Marked as published", "check_circle"),
    [showToast],
  );

  const confirmLogout = useCallback(() => {
    askConfirmInternal({
      icon: "logout",
      tone: "neutral",
      title: "Log out?",
      body: "You'll need to sign in again to access your workspace.",
      confirmLabel: "Log out",
      onConfirm: async () => {
        try {
          await logoutMutation.mutateAsync();
        } catch {
          showToast("Signed out locally — server session may still be active", "logout");
        }

        queryClient.clear();

        try {
          await signOut({ redirectUrl: "/sign-in" });
        } catch {
          router.replace("/sign-in");
        }
      },
    });
  }, [askConfirmInternal, logoutMutation, queryClient, router, showToast, signOut]);

  const confirmDeleteAccount = useCallback(() => {
    askConfirmInternal({
      icon: "delete",
      tone: "danger",
      title: "Delete your account?",
      body: "This permanently removes your profiles, drafts, and calendar. This can't be undone.",
      confirmLabel: "Delete account",
      onConfirm: () => {
        showToast("Account scheduled for deletion", "delete");
        router.push("/");
      },
    });
  }, [askConfirmInternal, router, showToast]);

  const confirmCancelPlan = useCallback(() => {
    askConfirmInternal({
      icon: "cancel",
      tone: "danger",
      title: "Cancel your subscription?",
      body: "You'll keep Pro access until the end of your billing period. No further charges after that.",
      confirmLabel: "Cancel plan",
      onConfirm: () => showToast("Subscription cancelled", "cancel"),
    });
  }, [askConfirmInternal, showToast]);

  const confirmRemoveClient = useCallback(
    (name: string, onConfirm: () => void) => {
      askConfirmInternal({
        icon: "person_remove",
        tone: "danger",
        title: `Remove ${name}?`,
        body: "Their drafts and calendar will be archived. You can re-add them later.",
        confirmLabel: "Remove client",
        onConfirm: () => {
          onConfirm();
          showToast("Client removed", "person_remove");
        },
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmDeleteDraft = useCallback(
    (title: string, onConfirm: () => void) => {
      askConfirmInternal({
        icon: "delete",
        tone: "danger",
        title: "Delete this draft?",
        body: `"${title}" will be permanently removed from your pipeline.`,
        confirmLabel: "Delete draft",
        onConfirm: () => {
          onConfirm();
          showToast("Draft deleted", "delete");
        },
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmDeleteContentProfile = useCallback(
    (name: string, onConfirm: () => void) => {
      askConfirmInternal({
        icon: "delete",
        tone: "danger",
        title: "Delete this content profile?",
        body: `"${name}" will be removed from this workspace. Posts already generated keep their history.`,
        confirmLabel: "Delete profile",
        onConfirm: () => {
          onConfirm();
          showToast("Content profile deleted", "delete");
        },
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmRejectPost = useCallback(
    (title: string, onConfirm: (feedback?: string) => void) => {
      askConfirmInternal({
        icon: "cancel",
        tone: "danger",
        title: "Reject this post package?",
        body: `"${title}" will be removed from the approval queue and returned to draft.`,
        confirmLabel: "Reject",
        onConfirm: () => {
          onConfirm();
          showToast("Post package rejected", "cancel");
        },
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmPauseAutopilot = useCallback(
    (onPause: () => void) => {
      askConfirmInternal({
        icon: "pause_circle",
        tone: "danger",
        title: "Pause Autopilot?",
        body: "No new posts will be generated until you turn it back on. Already-scheduled posts still publish.",
        confirmLabel: "Pause Autopilot",
        onConfirm: () => {
          onPause();
          showToast("Autopilot paused", "pause_circle");
        },
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmPublishNow = useCallback(
    (target: PublishTarget) => {
      if (!linkedinPublishReady) {
        openConnect();
        return;
      }
      askConfirmInternal({
        icon: "send",
        tone: "neutral",
        title: "Publish to LinkedIn now?",
        body: `"${target.hook}" will be published to your LinkedIn profile immediately.`,
        confirmLabel: "Publish now",
        onConfirm: () => {
          void publishPostMutation
            .mutateAsync({ postId: target.postId })
            .then((post) => {
              if (post.status === "published") {
                toastPublished();
                if (post.linkedInPostUrl) {
                  showToast("View your post on LinkedIn", "open_in_new");
                }
                return;
              }
              if (post.status === "failed") {
                showToast(
                  post.publishErrorMessage ?? "Publish failed",
                  "error",
                );
              }
            })
            .catch((err) => {
              const message = getApiErrorMessage(err);
              showToast(message, "error");
              if (
                err instanceof ApiError &&
                (err.code === "LINKEDIN_NOT_CONNECTED" ||
                  err.code === "LINKEDIN_SCOPE_MISSING")
              ) {
                openConnect();
              }
            });
        },
      });
    },
    [
      askConfirmInternal,
      linkedinPublishReady,
      openConnect,
      publishPostMutation,
      showToast,
      toastPublished,
    ],
  );

  const value: AppUiContextValue = {
    linkedinConnected,
    linkedinPublishReady,
    linkedInProfileName,
    linkedinConnectionState,
    openConnect,
    disconnectLinkedIn,
    requireLinkedIn,
    askConfirm,
    openSchedule,
    openRequestChanges,
    showToast,
    toastCopy,
    toastSave,
    toastSaved,
    toastScheduled,
    toastAddCal,
    toastPublished,
    confirmLogout,
    confirmDeleteAccount,
    confirmCancelPlan,
    confirmRemoveClient,
    confirmDeleteDraft,
    confirmDeleteContentProfile,
    confirmRejectPost,
    confirmPauseAutopilot,
    confirmPublishNow,
  };

  return (
    <AppUiContext.Provider value={value}>
      {children}
      {showConnect ? (
        <ConnectLinkedInModal
          connecting={connecting}
          mode={
            linkedinConnectionState === "needsPublishScope"
              ? "reauthorize"
              : "connect"
          }
          onClose={closeConnect}
          onConnect={() => void doConnectLinkedIn()}
        />
      ) : null}
      {confirm ? (
        <ConfirmDialog config={confirm} onCancel={cancelConfirm} onConfirm={doConfirm} />
      ) : null}
      {scheduleTarget ? (
        <ScheduleModal
          target={scheduleTarget}
          profileName={linkedInProfileName}
          timezone={userTimezone}
          isSubmitting={
            schedulePostMutation.isPending || reschedulePostMutation.isPending
          }
          error={scheduleError}
          onClose={closeSchedule}
          onConfirm={handleScheduleConfirm}
        />
      ) : null}
      {showRequestChanges ? (
        <RequestChangesModal
          open={showRequestChanges}
          feedback={requestChangesFeedback}
          onFeedbackChange={setRequestChangesFeedback}
          onClose={() => {
            setShowRequestChanges(false);
            setRequestChangesFeedback("");
          }}
          onSubmit={submitRequestChanges}
        />
      ) : null}
    </AppUiContext.Provider>
  );
}

export function useAppUi() {
  const ctx = useContext(AppUiContext);
  if (!ctx) {
    throw new Error("useAppUi must be used within AppUiProvider");
  }
  return ctx;
}
