"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, useUpdateCurrentUser } from "@/hooks/api/use-auth-api";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useLinkedInConnection, useLinkedInProfile } from "@/hooks/api/use-linkedin-api";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getLinkedInConnectionState,
  needsLinkedInProfileImport,
} from "@/lib/linkedin-utils";
import { PRODUCT_CORE_TOUR_ID } from "@/lib/tours/registry";
import {
  hasSeenTour,
  runProductTour,
  type TourRuntimeContext,
} from "@/lib/tours/run-tour";

type TourContextValue = {
  startTour: (tourId: string) => void;
  startProductTour: () => void;
  /** @deprecated alias for startProductTour */
  startAppBasicsTour: () => void;
  isTourRunning: boolean;
  hasSeenProductTour: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const updateUser = useUpdateCurrentUser();
  const { data: user } = useCurrentUser();
  const { activeWorkspaceId } = useWorkspace();
  const { data: connection } = useLinkedInConnection(activeWorkspaceId);
  const { data: linkedInProfile } = useLinkedInProfile(activeWorkspaceId);
  const { data: profiles = [] } = useContentProfiles(activeWorkspaceId);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const runningRef = useRef(false);

  const buildContext = useCallback((): TourRuntimeContext => {
    const linkedInState = getLinkedInConnectionState(
      connection ?? {
        connected: false,
        publishReady: false,
        profileName: null,
        approvedScopes: [],
        linkedInMemberId: null,
        clerkExternalAccountId: null,
      },
    );
    return {
      linkedInState,
      hasContentProfile: profiles.length > 0,
      plan: user?.plan ?? "free",
      needsLinkedInImport: linkedInProfile
        ? needsLinkedInProfileImport(linkedInProfile)
        : linkedInState === "publishReady",
    };
  }, [connection, linkedInProfile, profiles.length, user?.plan]);

  const markSeen = useCallback(
    (tourId: string) => {
      void updateUser.mutateAsync({ markTourSeen: tourId }).catch(() => {});
    },
    [updateUser],
  );

  const startTour = useCallback(
    (tourId: string) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setIsTourRunning(true);

      void runProductTour({
        tourId,
        context: buildContext(),
        navigate: (route) => {
          router.push(route);
        },
        onComplete: () => {
          markSeen(tourId);
          runningRef.current = false;
          setIsTourRunning(false);
        },
        onDismiss: () => {
          markSeen(tourId);
          runningRef.current = false;
          setIsTourRunning(false);
        },
      }).catch(() => {
        document.body.removeAttribute("data-pp-tour-active");
        runningRef.current = false;
        setIsTourRunning(false);
      });
    },
    [buildContext, markSeen, router],
  );

  const startProductTour = useCallback(() => {
    startTour(PRODUCT_CORE_TOUR_ID);
  }, [startTour]);

  const hasSeenProductTour = hasSeenTour(
    user?.toursSeen,
    PRODUCT_CORE_TOUR_ID,
  );

  const value = useMemo(
    () => ({
      startTour,
      startProductTour,
      startAppBasicsTour: startProductTour,
      isTourRunning,
      hasSeenProductTour,
    }),
    [startTour, startProductTour, isTourRunning, hasSeenProductTour],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}
