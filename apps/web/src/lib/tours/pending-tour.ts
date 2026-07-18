export const PENDING_TOUR_STORAGE_KEY = "pp_pending_tour";

export function setPendingTour(tourId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_TOUR_STORAGE_KEY, tourId);
}

export function clearPendingTour() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_TOUR_STORAGE_KEY);
}

export function takePendingTour(): string | null {
  if (typeof window === "undefined") return null;
  const tourId = sessionStorage.getItem(PENDING_TOUR_STORAGE_KEY);
  if (tourId) sessionStorage.removeItem(PENDING_TOUR_STORAGE_KEY);
  return tourId;
}

export function peekPendingTour(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_TOUR_STORAGE_KEY);
}
