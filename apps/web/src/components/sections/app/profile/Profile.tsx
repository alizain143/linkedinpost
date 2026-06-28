"use client";

import { useEffect, useRef, useState } from "react";
import { appLabel } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { ColorPickerField } from "@/components/ui/color-picker";
import { Input, InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import {
  useContentProfiles,
  useCreateContentProfile,
  useDeleteContentProfile,
  useUpdateContentProfile,
} from "@/hooks/api/use-content-profiles-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { ApiContentProfile } from "@/lib/api/types/content-profile";
import type { ContentGoal } from "@/lib/api/types/enums";
import {
  CONTENT_GOAL_OPTIONS,
  DEFAULT_CONTENT_GOAL,
  getContentGoalLabel,
} from "@/lib/content-goals";
import { TONE_OPTIONS } from "@/lib/form-options";
import { useAppUi } from "@/providers/app-ui-provider";
import { AiContentProfileWizard } from "@/components/sections/app/profile/AiContentProfileWizard";

type ProfileFormState = {
  name: string;
  roleTitle: string;
  industry: string;
  targetAudience: string;
  contentGoal: ContentGoal;
  preferredTone: string;
  brandPrimary: string;
  brandAccent: string;
  offerDescription: string;
  writingSample: string;
  avoidWords: string;
  isDefault: boolean;
  pillars: string[];
};

function emptyForm(isDefault: boolean): ProfileFormState {
  return {
    name: "",
    roleTitle: "",
    industry: "",
    targetAudience: "",
    contentGoal: DEFAULT_CONTENT_GOAL,
    preferredTone: "",
    brandPrimary: "",
    brandAccent: "",
    offerDescription: "",
    writingSample: "",
    avoidWords: "",
    isDefault,
    pillars: [],
  };
}

function profileToForm(profile: ApiContentProfile): ProfileFormState {
  return {
    name: profile.name,
    roleTitle: profile.roleTitle ?? "",
    industry: profile.industry ?? "",
    targetAudience: profile.targetAudience ?? "",
    contentGoal: profile.contentGoal,
    preferredTone: profile.preferredTone ?? "",
    brandPrimary: profile.brandPrimary ?? "",
    brandAccent: profile.brandAccent ?? "",
    offerDescription: profile.offerDescription ?? "",
    writingSample: profile.writingSample ?? "",
    avoidWords: profile.avoidWords ?? "",
    isDefault: profile.isDefault,
    pillars: [...profile.pillars]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((pillar) => pillar.name),
  };
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function formToBody(form: ProfileFormState) {
  return {
    name: form.name.trim(),
    roleTitle: optionalField(form.roleTitle),
    industry: optionalField(form.industry),
    targetAudience: optionalField(form.targetAudience),
    contentGoal: form.contentGoal,
    preferredTone: optionalField(form.preferredTone),
    brandPrimary: optionalField(form.brandPrimary),
    brandAccent: optionalField(form.brandAccent),
    offerDescription: optionalField(form.offerDescription),
    writingSample: optionalField(form.writingSample),
    avoidWords: optionalField(form.avoidWords),
    isDefault: form.isDefault,
    pillars: form.pillars,
  };
}

function ProfileSkeleton() {
  return (
    <div className="pp-gen" style={{ gridTemplateColumns: "1fr 372px" }}>
      <div className="h-[640px] animate-pulse rounded-[18px] bg-[#eceef4]" />
      <div className="h-64 animate-pulse rounded-[18px] bg-[#eceef4]" />
    </div>
  );
}

function VoicePreview({ form }: { form: ProfileFormState }) {
  const toneLabel = form.preferredTone || "your preferred tone";
  const goalLabel = getContentGoalLabel(form.contentGoal).toLowerCase();
  const sample =
    form.writingSample.trim() ||
    "Add a writing sample to preview how your posts will sound.";

  return (
    <div className="rounded-[18px] border border-[#eceef4] bg-white p-6">
      <h3 className="font-display text-base font-bold">Voice preview</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
        Based on your profile, posts will sound {toneLabel.toLowerCase()} and
        focus on {goalLabel} — never generic AI.
      </p>
      <div className="mt-4 rounded-xl border border-[#eef0f5] bg-[#fafbff] p-4">
        <p className="text-[13px] leading-relaxed text-[#3f4a5e]">
          &ldquo;{sample.length > 220 ? `${sample.slice(0, 220)}…` : sample}&rdquo;
        </p>
      </div>
    </div>
  );
}

function ProfileEditor() {
  const {
    activeWorkspace,
    activeWorkspaceId,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const { confirmDeleteContentProfile, showToast } = useAppUi();

  const {
    data: profiles,
    isLoading: profilesLoading,
    error: profilesError,
    refetch,
  } = useContentProfiles(activeWorkspaceId);

  const createProfile = useCreateContentProfile(activeWorkspaceId);
  const updateProfile = useUpdateContentProfile(activeWorkspaceId);
  const deleteProfile = useDeleteContentProfile(activeWorkspaceId);

  const [mode, setMode] = useState<"edit" | "create">("create");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ProfileFormState>(emptyForm(true));
  const [addingPillar, setAddingPillar] = useState(false);
  const [newPillarName, setNewPillarName] = useState("");
  const [aiWizardOpen, setAiWizardOpen] = useState(false);

  const initializedWorkspaceRef = useRef<string | null>(null);
  const isSaving = createProfile.isPending || updateProfile.isPending;
  const isDeleting = deleteProfile.isPending;

  useEffect(() => {
    if (!activeWorkspaceId || !profiles) return;

    if (initializedWorkspaceRef.current !== activeWorkspaceId) {
      initializedWorkspaceRef.current = activeWorkspaceId;

      if (profiles.length === 0) {
        setMode("create");
        setSelectedProfileId(null);
        setForm(emptyForm(true));
      } else {
        const defaultProfile =
          profiles.find((profile) => profile.isDefault) ?? profiles[0];
        setMode("edit");
        setSelectedProfileId(defaultProfile.id);
        setForm(profileToForm(defaultProfile));
      }
    }
  }, [activeWorkspaceId, profiles]);

  useEffect(() => {
    if (!profiles) return;

    if (
      mode === "edit" &&
      selectedProfileId &&
      !profiles.some((profile) => profile.id === selectedProfileId)
    ) {
      if (profiles.length === 0) {
        setMode("create");
        setSelectedProfileId(null);
        setForm(emptyForm(true));
      } else {
        const next =
          profiles.find((profile) => profile.isDefault) ?? profiles[0];
        setMode("edit");
        setSelectedProfileId(next.id);
        setForm(profileToForm(next));
      }
    }
  }, [profiles, mode, selectedProfileId]);

  const profileOptions =
    profiles?.map((profile) => ({
      value: profile.id,
      label: profile.isDefault ? `${profile.name} (Default)` : profile.name,
    })) ?? [];

  const toneOptions = [
    { value: "", label: "Select tone…" },
    ...TONE_OPTIONS.map((tone) => ({ value: tone, label: tone })),
  ];

  const updateField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startCreate = () => {
    setMode("create");
    setSelectedProfileId(null);
    setForm(emptyForm((profiles?.length ?? 0) === 0));
    setAddingPillar(false);
    setNewPillarName("");
  };

  const selectProfile = (profileId: string) => {
    const profile = profiles?.find((item) => item.id === profileId);
    if (!profile) return;
    setMode("edit");
    setSelectedProfileId(profileId);
    setForm(profileToForm(profile));
    setAddingPillar(false);
    setNewPillarName("");
  };

  const resetForm = () => {
    if (mode === "create") {
      if (profiles && profiles.length > 0) {
        const defaultProfile =
          profiles.find((profile) => profile.isDefault) ?? profiles[0];
        setMode("edit");
        setSelectedProfileId(defaultProfile.id);
        setForm(profileToForm(defaultProfile));
      } else {
        setForm(emptyForm(true));
      }
    } else if (selectedProfileId) {
      const profile = profiles?.find((item) => item.id === selectedProfileId);
      if (profile) setForm(profileToForm(profile));
    }
    setAddingPillar(false);
    setNewPillarName("");
  };

  const commitPillar = () => {
    const trimmed = newPillarName.trim();
    if (!trimmed) {
      setAddingPillar(false);
      setNewPillarName("");
      return;
    }
    if (form.pillars.some((pillar) => pillar.toLowerCase() === trimmed.toLowerCase())) {
      showToast("That pillar already exists", "info");
      return;
    }
    updateField("pillars", [...form.pillars, trimmed]);
    setAddingPillar(false);
    setNewPillarName("");
  };

  const removePillar = (index: number) => {
    updateField(
      "pillars",
      form.pillars.filter((_, pillarIndex) => pillarIndex !== index),
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Profile name is required", "error");
      return;
    }

    const body = formToBody(form);

    try {
      if (mode === "create") {
        const created = await createProfile.mutateAsync(body);
        setMode("edit");
        setSelectedProfileId(created.id);
        setForm(profileToForm(created));
      } else if (selectedProfileId) {
        const updated = await updateProfile.mutateAsync({
          profileId: selectedProfileId,
          body,
        });
        setForm(profileToForm(updated));
      }
      showToast("Changes saved", "check_circle");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  };

  const handleDelete = () => {
    if (!selectedProfileId || mode !== "edit") return;
    const profile = profiles?.find((item) => item.id === selectedProfileId);
    if (!profile) return;

    confirmDeleteContentProfile(profile.name, () => {
      void deleteProfile.mutateAsync(selectedProfileId).catch((error) => {
        showToast(getApiErrorMessage(error), "error");
      });
    });
  };

  const showSelector = (profiles?.length ?? 0) > 0;
  const showEmptyBanner = profiles?.length === 0 && mode === "create";

  const handleAiProfilesApproved = (created: ApiContentProfile[]) => {
    const first = created[0];
    if (!first) return;

    void refetch().then(() => {
      setMode("edit");
      setSelectedProfileId(first.id);
      setForm(profileToForm(first));
    });
  };

  return (
    <QueryState
      isLoading={workspaceLoading || profilesLoading || !activeWorkspaceId}
      error={profilesError}
      onRetry={() => void refetch()}
      skeleton={<ProfileSkeleton />}
    >
      <div className="pp-gen" style={{ gridTemplateColumns: "1fr 372px" }}>
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[#eceef4] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Content profile</h2>
                <p className="mt-1 text-[13px] text-[#94a3b8]">
                  Your voice, audience, and strategy — used by every AI agent.
                  {activeWorkspace?.type === "client" ? (
                    <>
                      {" "}
                      Editing profile for{" "}
                      <span className="font-semibold text-[#64748b]">
                        {activeWorkspace.name}
                      </span>
                      .
                    </>
                  ) : null}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setAiWizardOpen(true)}
              >
                Generate with AI
              </Button>
            </div>

            {showEmptyBanner ? (
              <div className="mt-4 rounded-xl border border-dashed border-[#dce3f0] bg-[#fafbff] px-4 py-3 text-[13px] text-[#64748b]">
                <p>No content profile yet. Create one to power AI generation for
                this workspace.</p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAiWizardOpen(true)}
                >
                  Create with AI
                </Button>
              </div>
            ) : null}

            {showSelector ? (
              <div className="mt-5 flex flex-wrap items-end gap-2">
                <SelectField
                  label="Active profile"
                  className="min-w-[240px] flex-1"
                  value={mode === "create" ? "" : (selectedProfileId ?? "")}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) return;
                    selectProfile(value);
                  }}
                  options={[
                    ...(mode === "create"
                      ? [{ value: "", label: "New profile (unsaved)" }]
                      : []),
                    ...profileOptions,
                  ]}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={startCreate}
                >
                  + New profile
                </Button>
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <InputField
                label="Profile name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Maya — Startup Founder"
              />
              <InputField
                label="Role"
                value={form.roleTitle}
                onChange={(event) => updateField("roleTitle", event.target.value)}
                placeholder="Co-founder & CEO"
              />
              <InputField
                label="Industry"
                value={form.industry}
                onChange={(event) => updateField("industry", event.target.value)}
                placeholder="B2B SaaS"
              />
              <InputField
                label="Audience"
                value={form.targetAudience}
                onChange={(event) =>
                  updateField("targetAudience", event.target.value)
                }
                placeholder="Early-stage founders & operators"
              />
              <SelectField
                label="Goal"
                value={form.contentGoal}
                onChange={(event) =>
                  updateField("contentGoal", event.target.value as ContentGoal)
                }
                options={CONTENT_GOAL_OPTIONS}
              />
              <SelectField
                label="Tone"
                value={form.preferredTone}
                onChange={(event) =>
                  updateField("preferredTone", event.target.value)
                }
                options={toneOptions}
              />
              <div className="grid grid-cols-2 gap-3">
                <ColorPickerField
                  label="Brand primary"
                  value={form.brandPrimary}
                  onChange={(value) => updateField("brandPrimary", value)}
                  placeholder="#1a1a2e"
                />
                <ColorPickerField
                  label="Brand accent"
                  value={form.brandAccent}
                  onChange={(value) => updateField("brandAccent", value)}
                  placeholder="#5B3DF5"
                />
              </div>
              <InputField
                label="Offer"
                value={form.offerDescription}
                onChange={(event) =>
                  updateField("offerDescription", event.target.value)
                }
                placeholder="What you sell or promote"
              />

              <div>
                <label className={appLabel}>Content pillars</label>
                <div className="flex flex-wrap gap-2">
                  {form.pillars.map((pillar, index) => (
                    <span
                      key={`${pillar}-${index}`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#4338ca]"
                    >
                      {pillar}
                      <button
                        type="button"
                        className="text-[#6366f1] hover:text-[#4338ca]"
                        aria-label={`Remove ${pillar}`}
                        onClick={() => removePillar(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {addingPillar ? (
                    <Input
                      variant="app-sm"
                      className="w-[180px]"
                      value={newPillarName}
                      autoFocus
                      placeholder="Pillar name"
                      onChange={(event) => setNewPillarName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitPillar();
                        }
                        if (event.key === "Escape") {
                          setAddingPillar(false);
                          setNewPillarName("");
                        }
                      }}
                      onBlur={commitPillar}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      shape="pill"
                      className="border-dashed"
                      onClick={() => setAddingPillar(true)}
                    >
                      + Add
                    </Button>
                  )}
                </div>
              </div>

              <TextareaField
                label="Writing sample"
                className="h-24"
                value={form.writingSample}
                onChange={(event) =>
                  updateField("writingSample", event.target.value)
                }
                placeholder="Paste a post you've written that sounds like you…"
              />

              <InputField
                label="Words to avoid"
                value={form.avoidWords}
                onChange={(event) => updateField("avoidWords", event.target.value)}
                placeholder="leverage, synergy, game-changer"
              />

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#eef0f5] bg-[#fafbff] px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-[#1e293b]">
                    Set as default profile
                  </div>
                  <div className="text-xs text-[#94a3b8]">
                    Used by Generate and Autopilot when no profile is chosen.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isDefault}
                  disabled={isSaving}
                  onClick={() => updateField("isDefault", !form.isDefault)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    form.isDefault ? "bg-[#4f46e5]" : "bg-[#cbd5e1]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.isDefault ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSaving || isDeleting}
                onClick={() => void handleSave()}
              >
                {isSaving ? "Saving…" : "Save profile"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSaving || isDeleting}
                onClick={resetForm}
              >
                Cancel
              </Button>
              {mode === "edit" && selectedProfileId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="text-[#dc2626] hover:border-[#fecaca] hover:bg-[#fef2f2]"
                  disabled={isSaving || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Deleting…" : "Delete profile"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <VoicePreview form={form} />
        </div>
      </div>

      {activeWorkspaceId ? (
        <AiContentProfileWizard
          open={aiWizardOpen}
          workspaceId={activeWorkspaceId}
          hasExistingProfiles={(profiles?.length ?? 0) > 0}
          onClose={() => setAiWizardOpen(false)}
          onApproved={handleAiProfilesApproved}
        />
      ) : null}
    </QueryState>
  );
}

export default ProfileEditor;
