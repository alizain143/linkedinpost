"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  isExternalExtensionInstallUrl,
  linkedInExtensionInstallUrl,
} from "@/lib/linkedin-extension-config";

const EXTENSION_PATH = "apps/linkedin-import-extension";

export default function InstallLinkedInExtensionPage() {
  const installUrl = linkedInExtensionInstallUrl();
  const storeInstall = isExternalExtensionInstallUrl(installUrl);

  useEffect(() => {
    if (storeInstall) {
      window.location.replace(installUrl);
    }
  }, [storeInstall, installUrl]);

  if (storeInstall) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-[#64748b]">
          Redirecting to the Chrome Web Store…
        </p>
        <p className="mt-4 text-sm text-[#475569]">
          If nothing happens,{" "}
          <a href={installUrl} className="text-[#4f46e5] underline">
            open the extension listing
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-[#0f172a]">
        Install the LinkedIn import extension
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
        linkedinpost needs the Chrome extension to read your LinkedIn profile
        when you click import. We never auto-scrape. You control when data is
        sent.
      </p>

      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-[#475569]">
        <li>
          Open Chrome and go to{" "}
          <code className="rounded bg-[#f1f5f9] px-1">chrome://extensions</code>
        </li>
        <li>
          Enable <strong>Developer mode</strong> (top right)
        </li>
        <li>
          Click <strong>Load unpacked</strong>
        </li>
        <li>
          Select the folder{" "}
          <code className="rounded bg-[#f1f5f9] px-1">{EXTENSION_PATH}</code> in
          this repo
        </li>
        <li>Pin the extension from the puzzle icon in the toolbar</li>
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="primary" size="sm" href="/app/settings">
          Back to Settings
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            window.open("chrome://extensions", "_blank");
          }}
        >
          Open chrome://extensions
        </Button>
      </div>

      <p className="mt-6 text-xs text-[#94a3b8]">
        After installing, return to{" "}
        <Link href="/app/settings" className="text-[#4f46e5] underline">
          Settings
        </Link>{" "}
        and click <strong>Import profile</strong> again.
      </p>
    </div>
  );
}
