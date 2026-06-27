"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { ConnectLinkedInModal } from "@/components/modals/connect-linkedin-modal";
import { RequestChangesModal } from "@/components/modals/request-changes-modal";
import { ScheduleModal } from "@/components/modals/schedule-modal";
import { usePpToast } from "@/providers/pp-toast-provider";

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

  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRequestChanges, setShowRequestChanges] = useState(false);

  const openConnect = useCallback(() => setShowConnect(true), []);
  const closeConnect = useCallback(() => {
    setShowConnect(false);
    setConnecting(false);
  }, []);

  const doConnectLinkedIn = useCallback(() => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setShowConnect(false);
      setLinkedinConnected(true);
      showToast("LinkedIn connected", "link");
    }, 1400);
  }, [showToast]);

  const disconnectLinkedIn = useCallback(() => {
    setConfirm({
      icon: "link_off",
      tone: "danger",
      title: "Disconnect LinkedIn?",
      body: "Scheduled posts won't publish until you reconnect. Your drafts and calendar stay saved.",
      confirmLabel: "Disconnect",
      onConfirm: () => {
        setLinkedinConnected(false);
        showToast("LinkedIn disconnected", "link_off");
      },
    });
  }, [showToast]);

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
      if (linkedinConnected) fn();
      else openConnect();
    },
    [linkedinConnected, openConnect],
  );

  const openSchedule = useCallback(() => {
    if (linkedinConnected) setShowSchedule(true);
    else openConnect();
  }, [linkedinConnected, openConnect]);

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
        showToast("Logged out", "logout");
        await signOut({ redirectUrl: "/sign-in" });
      },
    });
  }, [askConfirmInternal, showToast, signOut]);

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
    if (!linkedinConnected) {
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
  }, [askConfirmInternal, linkedinConnected, openConnect, showToast]);

  const value: AppUiContextValue = {
    linkedinConnected,
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
          onConnect={doConnectLinkedIn}
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
