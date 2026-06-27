"use client";

import { useRef, useState } from "react";
import { appLabel } from "@/components/app/app-ui";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { PUBLISHING_SETTING_FIELDS } from "@/lib/form-options";
import { useAppUi } from "@/providers/app-ui-provider";

const TOGGLES = [
  { label: "Weekly content reminders", desc: "A nudge when it's time to plan your week.", default: true },
  { label: "Generation complete", desc: "Email me when my posts are ready.", default: true },
  { label: "Product updates", desc: "New features and tips from linkedinpost.ai.", default: false },
];

export default function Settings() {
  const [toggles, setToggles] = useState(
    TOGGLES.map((t) => ({ ...t, on: t.default })),
  );
  const {
    linkedinConnected,
    openConnect,
    disconnectLinkedIn,
    toastSaved,
    confirmDeleteAccount,
    showToast,
  } = useAppUi();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file", "error");
      return;
    }
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    showToast("Photo updated", "photo_camera");
    e.target.value = "";
  };

  const clearPhoto = () => {
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    showToast("Photo removed", "delete");
  };

  return (
    <div className="mx-auto max-w-[680px] space-y-5">
      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Account</h2>

        <div className="mt-4 mb-5 flex flex-wrap items-center gap-4">
          <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#fb7185] to-[#f43f5e]">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-white">
                MR
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handlePhotoPick}
            />
            <Button
              type="button"
              variant="muted"
              size="sm"
              className="rounded-[10px] px-[15px]"
              onClick={() => photoInputRef.current?.click()}
            >
              <MsIcon name="photo_camera" size={17} className="text-[#64748b]" />
              {photoPreview ? "Change photo" : "Upload photo"}
            </Button>
            {photoPreview ? (
              <Button
                type="button"
                variant="muted"
                size="sm"
                className="rounded-[10px] px-[15px]"
                onClick={clearPhoto}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Full name" defaultValue="Maya Reyes" />
          <InputField
            label="Email"
            type="email"
            defaultValue="maya@northbeam.co"
            disabled
            aria-disabled
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="primary" size="sm" className="rounded-[10px] px-[18px] py-2.5 text-[13.5px]" onClick={toastSaved}>
            Save changes
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Connections</h2>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#eceef4] bg-[#f8f9fc] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a66c2] font-display text-sm font-extrabold text-white">
              in
            </div>
            <div>
              <div className="text-sm font-semibold">LinkedIn</div>
              <div className="text-xs text-[#94a3b8]">
                {linkedinConnected ? "Connected as Maya Reyes" : "Not connected"}
              </div>
            </div>
          </div>
          {linkedinConnected ? (
            <Button type="button" variant="muted" size="xs" onClick={disconnectLinkedIn}>
              Disconnect
            </Button>
          ) : (
            <Button type="button" variant="linkedin" size="xs" onClick={openConnect}>
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">LinkedIn publishing</h2>
        {!linkedinConnected ? (
          <div className="mt-3 flex items-center gap-2 rounded-[11px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[13px] text-[#92400e]">
            <MsIcon name="warning" size={18} />
            Connect LinkedIn to enable publishing and scheduling.
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {PUBLISHING_SETTING_FIELDS.map((field) => (
            <SelectField
              key={field.label}
              label={field.label}
              options={field.options}
              defaultValue={field.default}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eceef4] bg-white p-6">
        <h2 className="font-display text-lg font-bold">Notifications</h2>
        <div className="mt-4 space-y-4">
          {toggles.map((t, i) => (
            <div key={t.label} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-xs text-[#94a3b8]">{t.desc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={t.on}
                onClick={() =>
                  setToggles((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, on: !item.on } : item,
                    ),
                  )
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  t.on ? "bg-[#4f46e5]" : "bg-[#cbd5e1]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    t.on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
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
  );
}
