declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", name, params);
  }

  if (window.clarity) {
    window.clarity("event", name);
  }
}

export function trackSignUpComplete(method: "email" | "oauth" = "email") {
  trackEvent("sign_up", { method });
}

export function trackCheckoutStart(plan: string) {
  trackEvent("begin_checkout", { plan });
}
