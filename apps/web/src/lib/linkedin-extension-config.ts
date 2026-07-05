/** Chrome Web Store URL when published. Dev: use install page instead. */
export function linkedInExtensionInstallUrl(): string {
  return (
    process.env.NEXT_PUBLIC_LINKEDIN_EXTENSION_INSTALL_URL ??
    "/app/install-linkedin-extension"
  );
}

export function isExternalExtensionInstallUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}
