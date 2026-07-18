/** Chrome Web Store listing for the LinkedIn profile import extension. */
export const CHROME_WEB_STORE_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/linkedinpost-%E2%80%94-profile-im/fbghhjbahijljiejdnmhmkkjiiaekigf";

/**
 * Where to send users when the import extension is missing.
 * Override with NEXT_PUBLIC_LINKEDIN_EXTENSION_INSTALL_URL (e.g. local install page in dev).
 */
export function linkedInExtensionInstallUrl(): string {
  return (
    process.env.NEXT_PUBLIC_LINKEDIN_EXTENSION_INSTALL_URL ??
    CHROME_WEB_STORE_EXTENSION_URL
  );
}

export function isExternalExtensionInstallUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}
