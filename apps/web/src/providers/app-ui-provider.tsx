"use client";

import { Suspense, useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { ConnectLinkedInModal } from "@/components/modals/connect-linkedin-modal";
import { RequestChangesModal } from "@/components/modals/request-changes-modal";
import { ScheduleModal } from "@/components/modals/schedule-modal";
import { useLogout } from "@/hooks/api/use-auth-api";
import { useLinkedInClerk } from "@/hooks/use-linkedin-clerk";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";
import { clerkErrorMessage } from "@/lib/auth/clerk";
import {
  LINKEDIN_CONNECT_CALLBACK,
  LINKEDIN_CONNECT_COMPLETE,
  LINKEDIN_OAUTH_STRATEGY,
  LINKEDIN_PUBLISH_SCOPE,
} from "@/lib/auth/linkedin-clerk";
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
  openConnect: () => void;
  disconnectLinkedIn: () => void;
  requireLinkedIn: (fn: () => void) => () => void;
  askConfirm: (cfg: ConfirmConfig) => void;
  openSchedule: () => void;
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
  confirmRemoveClient: (name: string) => void;
  confirmDeleteDraft: (title: string) => void;
  confirmRejectPost: () => void;
  confirmPauseAutopilot: (onPause: () => void) => void;
  confirmPublishNow: () => void;
};

const AppUiContext = createContext<AppUiContextValue | null>(null);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = usePpToast();
  const { signOut } = useClerk();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const bypass = isAuthBypassEnabled();

  const { connected, publishReady, profileName, externalAccount, user } =
    useLinkedInClerk();

  const [mockLinkedInConnected, setMockLinkedInConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRequestChanges, setShowRequestChanges] = useState(false);

  const linkedinConnected = bypass ? mockLinkedInConnected : connected;
  const linkedinPublishReady = bypass ? mockLinkedInConnected : publishReady;
  const linkedInProfileName = bypass
    ? mockLinkedInConnected
      ? "Maya Reyes"
      : null
    : profileName;

  const openConnect = useCallback(() => setShowConnect(true), []);
  const closeConnect = useCallback(() => {
    setShowConnect(false);
    setConnecting(false);
  }, []);

  const doConnectLinkedIn = useCallback(async () => {
    if (bypass) {
      setShowConnect(false);
      setMockLinkedInConnected(true);
      showToast("LinkedIn connected", "link");
      return;
    }

    if (!user) {
      showToast("Sign in to connect LinkedIn", "link_off");
      return;
    }

    setConnecting(true);
    try {
      if (externalAccount && connected && !publishReady) {
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
  }, [bypass, connected, externalAccount, publishReady, showToast, user]);

  const disconnectLinkedIn = useCallback(() => {
    setConfirm({
      icon: "link_off",
      tone: "danger",
      title: "Disconnect LinkedIn?",
      body: "Scheduled posts won't publish until you reconnect. Your drafts and calendar stay saved.",
      confirmLabel: "Disconnect",
      onConfirm: () => {
        if (bypass) {
          setMockLinkedInConnected(false);
          showToast("LinkedIn disconnected", "link_off");
          return;
        }

        if (!externalAccount) {
          showToast("LinkedIn is not connected", "link_off");
          return;
        }

        void externalAccount
          .destroy()
          .then(async () => {
            await user?.reload();
            showToast("LinkedIn disconnected", "link_off");
          })
          .catch((err) => showToast(clerkErrorMessage(err), "link_off"));
      },
    });
  }, [bypass, externalAccount, showToast, user]);

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

  const openSchedule = useCallback(() => {
    if (linkedinPublishReady) setShowSchedule(true);
    else openConnect();
  }, [linkedinPublishReady, openConnect]);

  const confirmSchedule = useCallback(() => {
    setShowSchedule(false);
    showToast("Approved & scheduled for Mon 9:00 AM", "event_available");
  }, [showToast]);

  const submitRequestChanges = useCallback(() => {
    setShowRequestChanges(false);
    showToast("Revision sent to AI Council", "send");
  }, [showToast]);

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
    (name: string) => {
      askConfirmInternal({
        icon: "person_remove",
        tone: "danger",
        title: `Remove ${name}?`,
        body: "Their drafts and calendar will be archived. You can re-add them later.",
        confirmLabel: "Remove client",
        onConfirm: () => showToast("Client removed", "person_remove"),
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmDeleteDraft = useCallback(
    (title: string) => {
      askConfirmInternal({
        icon: "delete",
        tone: "danger",
        title: "Delete this draft?",
        body: `"${title}" will be permanently removed from your pipeline.`,
        confirmLabel: "Delete draft",
        onConfirm: () => showToast("Draft deleted", "delete"),
      });
    },
    [askConfirmInternal, showToast],
  );

  const confirmRejectPost = useCallback(() => {
    askConfirmInternal({
      icon: "cancel",
      tone: "danger",
      title: "Reject this post package?",
      body: "It will be removed from the approval queue. This can't be undone.",
      confirmLabel: "Reject",
      onConfirm: () => showToast("Post package rejected", "cancel"),
    });
  }, [askConfirmInternal, showToast]);

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

  const confirmPublishNow = useCallback(() => {
    if (!linkedinPublishReady) {
      openConnect();
      return;
    }
    askConfirmInternal({
      icon: "send",
      tone: "neutral",
      title: "Publish to LinkedIn now?",
      body: "This post package will be published to your LinkedIn profile immediately.",
      confirmLabel: "Publish now",
      onConfirm: () => showToast("Published to LinkedIn", "check_circle"),
    });
  }, [askConfirmInternal, linkedinPublishReady, openConnect, showToast]);

  const value: AppUiContextValue = {
    linkedinConnected,
    linkedinPublishReady,
    linkedInProfileName,
    openConnect,
    disconnectLinkedIn,
    requireLinkedIn,
    askConfirm,
    openSchedule,
    openRequestChanges: () => setShowRequestChanges(true),
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
          onClose={closeConnect}
          onConnect={() => void doConnectLinkedIn()}
        />
      ) : null}
      {confirm ? (
        <ConfirmDialog config={confirm} onCancel={cancelConfirm} onConfirm={doConfirm} />
      ) : null}
      {showSchedule ? (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onConfirm={confirmSchedule}
        />
      ) : null}
      {showRequestChanges ? (
        <RequestChangesModal
          onClose={() => setShowRequestChanges(false)}
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
