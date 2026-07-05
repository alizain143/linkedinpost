"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalHeader } from "@/components/modals/modal-header";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { useCredits } from "@/hooks/api/use-credits-api";
import {
  useApproveContentProfileSuggestions,
  useSuggestContentProfiles,
} from "@/hooks/api/use-content-profiles-api";
import { useLinkedInProfile } from "@/hooks/api/use-linkedin-api";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type {
  ApiContentProfile,
  CreateContentProfileBody,
  SuggestedContentProfile,
} from "@/lib/api/types/content-profile";
import type { ContentGoal } from "@/lib/api/types/enums";
import {
  CONTENT_GOAL_OPTIONS,
  DEFAULT_CONTENT_GOAL,
  getContentGoalLabel,
} from "@/lib/content-goals";
import { CONTENT_PROFILE_AI_CREDIT_COST } from "@/lib/credit-costs";
import { isCreditsExhaustedError } from "@/lib/credits-errors";
import { useAppUi } from "@/providers/app-ui-provider";

type AiContentProfileWizardProps = {
  open: boolean;
  workspaceId: string;
  hasExistingProfiles: boolean;
  onClose: () => void;
  onApproved: (profiles: ApiContentProfile[]) => void;
};

type QuestionnaireState = {
  roleTitle: string;
  industry: string;
  targetAudience: string;
  contentGoal: ContentGoal;
  offerDescription: string;
  notes: string;
};

const EMPTY_QUESTIONNAIRE: QuestionnaireState = {
  roleTitle: "",
  industry: "",
  targetAudience: "",
  contentGoal: DEFAULT_CONTENT_GOAL,
  offerDescription: "",
  notes: "",
};

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function questionnaireToBody(form: QuestionnaireState) {
  return {
    roleTitle: optionalField(form.roleTitle),
    industry: optionalField(form.industry),
    targetAudience: optionalField(form.targetAudience),
    contentGoal: form.contentGoal,
    offerDescription: optionalField(form.offerDescription),
    notes: optionalField(form.notes),
  };
}

function SuggestionCard({
  profile,
  selected,
  onToggle,
  onChange,
}: {
  profile: SuggestedContentProfile;
  selected: boolean;
  onToggle: () => void;
  onChange: (profile: SuggestedContentProfile) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        selected
          ? "border-[#c4b5fd] bg-[#faf8ff]"
          : "border-[#eceef4] bg-white"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 accent-[#5B3DF5]"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-display text-[15px] font-bold text-[#1e293b]">
              {profile.name}
            </p>
            <p className="mt-1 text-[12.5px] text-[#64748b]">
              {profile.roleTitle ?? "Role TBD"} ·{" "}
              {getContentGoalLabel(profile.contentGoal ?? DEFAULT_CONTENT_GOAL)}
            </p>
          </div>

          <InputField
            label="Profile name"
            value={profile.name}
            onChange={(event) =>
              onChange({ ...profile, name: event.target.value })
            }
          />
          <InputField
            label="Role"
            value={profile.roleTitle ?? ""}
            onChange={(event) =>
              onChange({ ...profile, roleTitle: event.target.value })
            }
          />
          <InputField
            label="Tone"
            value={profile.preferredTone ?? ""}
            onChange={(event) =>
              onChange({ ...profile, preferredTone: event.target.value })
            }
          />

          {profile.pillars && profile.pillars.length > 0 ? (
            <div>
              <p className="mb-2 text-[12.5px] font-semibold text-[#475569]">
                Pillars
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.pillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full bg-[#f0edff] px-2.5 py-1 text-[11.5px] font-medium text-[#5B3DF5]"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.writingSample ? (
            <div className="rounded-lg border border-[#eef0f5] bg-[#fafbff] p-3">
              <p className="text-[12px] leading-relaxed text-[#64748b]">
                &ldquo;{profile.writingSample}&rdquo;
              </p>
            </div>
          ) : null}
        </div>
      </label>
    </div>
  );
}

export function AiContentProfileWizard({
  open,
  workspaceId,
  hasExistingProfiles,
  onClose,
  onApproved,
}: AiContentProfileWizardProps) {
  const { showToast } = useAppUi();
  const { canAfford } = useCredits();
  const { data: linkedInProfile } = useLinkedInProfile(workspaceId);
  const suggestProfiles = useSuggestContentProfiles(workspaceId);
  const approveProfiles = useApproveContentProfileSuggestions(workspaceId);

  const [step, setStep] = useState<"questionnaire" | "review">("questionnaire");
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireState>(EMPTY_QUESTIONNAIRE);
  const [suggestions, setSuggestions] = useState<SuggestedContentProfile[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    if (!open) {
      setStep("questionnaire");
      setQuestionnaire(EMPTY_QUESTIONNAIRE);
      setSuggestions([]);
      setSelectedIndices([0, 1, 2]);
      return;
    }

    setQuestionnaire((current) => ({
      ...current,
      roleTitle: linkedInProfile?.currentTitle ?? current.roleTitle,
      industry: linkedInProfile?.currentCompany ?? current.industry,
    }));
  }, [open, linkedInProfile?.currentTitle, linkedInProfile?.currentCompany]);

  const selectedCount = selectedIndices.length;
  const approveCost = selectedCount * CONTENT_PROFILE_AI_CREDIT_COST;
  const canAffordApprove = canAfford(approveCost);

  const selectedProfiles = useMemo(
    () =>
      selectedIndices
        .map((index) => suggestions[index])
        .filter((profile): profile is SuggestedContentProfile => !!profile),
    [selectedIndices, suggestions],
  );

  if (!open) return null;

  const handleGenerate = async () => {
    try {
      const result = await suggestProfiles.mutateAsync(
        questionnaireToBody(questionnaire),
      );
      setSuggestions(result.profiles);
      setSelectedIndices(result.profiles.map((_, index) => index));
      setStep("review");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  };

  const handleApprove = async () => {
    if (selectedProfiles.length === 0) {
      showToast("Select at least one profile to save.", "error");
      return;
    }

    if (!canAffordApprove) {
      showToast(
        `You need ${approveCost} credits to save ${selectedCount} profile${selectedCount === 1 ? "" : "s"}.`,
        "error",
      );
      return;
    }

    const profiles: CreateContentProfileBody[] = selectedProfiles.map(
      (profile, index) => ({
        name: profile.name.trim(),
        roleTitle: optionalField(profile.roleTitle ?? ""),
        industry: optionalField(profile.industry ?? ""),
        targetAudience: optionalField(profile.targetAudience ?? ""),
        contentGoal: profile.contentGoal ?? DEFAULT_CONTENT_GOAL,
        preferredTone: optionalField(profile.preferredTone ?? ""),
        brandPrimary: optionalField(profile.brandPrimary ?? ""),
        brandAccent: optionalField(profile.brandAccent ?? ""),
        offerDescription: optionalField(profile.offerDescription ?? ""),
        writingSample: optionalField(profile.writingSample ?? ""),
        avoidWords: optionalField(profile.avoidWords ?? ""),
        isDefault: !hasExistingProfiles && index === 0,
        pillars: profile.pillars ?? [],
      }),
    );

    for (const profile of profiles) {
      if (!profile.name) {
        showToast("Each selected profile needs a name.", "error");
        return;
      }
    }

    try {
      const created = await approveProfiles.mutateAsync({ profiles });
      showToast(
        `Saved ${created.length} profile${created.length === 1 ? "" : "s"}`,
        "check_circle",
      );
      onApproved(created);
      onClose();
    } catch (error) {
      if (isCreditsExhaustedError(error)) {
        showToast(getApiErrorMessage(error), "error");
        return;
      }
      showToast(getApiErrorMessage(error), "error");
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index].sort((a, b) => a - b),
    );
  };

  const updateSuggestion = (index: number, profile: SuggestedContentProfile) => {
    setSuggestions((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? profile : item)),
    );
  };

  return (
    <div
      className="animate-ppfade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-ppscale flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-[#eceef4] p-[26px] pb-5">
          <ModalHeader
            icon="auto_awesome"
            title={
              step === "questionnaire"
                ? "Generate content profiles with AI"
                : "Review AI profile suggestions"
            }
          />
          <p className="text-[13.5px] leading-[1.5] text-[#64748b]">
            {step === "questionnaire"
              ? "Optional details help the AI tailor three profile options. Preview is free."
              : `Select profiles to save · ${CONTENT_PROFILE_AI_CREDIT_COST} credit each`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-[26px] pt-5">
          {step === "questionnaire" ? (
            <div className="space-y-4">
              {linkedInProfile ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#dce3f0] bg-[#fafbff] px-4 py-3 text-[13px] text-[#64748b]">
                  {linkedInProfile.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linkedInProfile.pictureUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : null}
                  <div>
                    Using LinkedIn data for{" "}
                    <span className="font-semibold text-[#475569]">
                      {linkedInProfile.fullName ?? "your profile"}
                    </span>
                    {linkedInProfile.currentTitle
                      ? ` · ${linkedInProfile.currentTitle}`
                      : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#dce3f0] bg-[#fafbff] px-4 py-3 text-[13px] text-[#64748b]">
                  Connect LinkedIn in Settings for richer suggestions, or fill
                  in the fields below.
                </div>
              )}

              <InputField
                label="Role"
                value={questionnaire.roleTitle}
                onChange={(event) =>
                  setQuestionnaire((current) => ({
                    ...current,
                    roleTitle: event.target.value,
                  }))
                }
                placeholder="Co-founder & CEO"
              />
              <InputField
                label="Industry"
                value={questionnaire.industry}
                onChange={(event) =>
                  setQuestionnaire((current) => ({
                    ...current,
                    industry: event.target.value,
                  }))
                }
                placeholder="B2B SaaS"
              />
              <InputField
                label="Target audience"
                value={questionnaire.targetAudience}
                onChange={(event) =>
                  setQuestionnaire((current) => ({
                    ...current,
                    targetAudience: event.target.value,
                  }))
                }
                placeholder="Early-stage founders"
              />
              <SelectField
                label="Primary goal"
                value={questionnaire.contentGoal}
                onChange={(event) =>
                  setQuestionnaire((current) => ({
                    ...current,
                    contentGoal: event.target.value as ContentGoal,
                  }))
                }
                options={CONTENT_GOAL_OPTIONS}
              />
              <TextareaField
                label="Offer"
                hint="(optional)"
                value={questionnaire.offerDescription}
                onChange={(event) =>
                  setQuestionnaire((current) => ({
                    ...current,
                    offerDescription: event.target.value,
                  }))
                }
                placeholder="What you sell or promote"
                className="h-20"
              />
              <TextareaField
                label="Notes for AI"
                hint="(optional)"
                value={questionnaire.notes}
                onChange={(event) =>
                  setQuestionnaire((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Any positioning, niche, or topics to emphasize"
                className="h-20"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((profile, index) => (
                <SuggestionCard
                  key={`${profile.name}-${index}`}
                  profile={profile}
                  selected={selectedIndices.includes(index)}
                  onToggle={() => toggleSelection(index)}
                  onChange={(updated) => updateSuggestion(index, updated)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#eceef4] p-[26px] pt-4">
          {step === "review" ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep("questionnaire")}
              disabled={approveProfiles.isPending}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {step === "review" ? (
              <p className="mr-2 text-[12.5px] text-[#64748b]">
                {selectedCount} selected · {approveCost} credit
                {approveCost === 1 ? "" : "s"}
              </p>
            ) : null}

            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>

            {step === "questionnaire" ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={suggestProfiles.isPending}
                onClick={() => void handleGenerate()}
              >
                <MsIcon
                  name={suggestProfiles.isPending ? "progress_activity" : "auto_awesome"}
                  size={17}
                  className={suggestProfiles.isPending ? "animate-spin" : undefined}
                />
                {suggestProfiles.isPending ? "Generating…" : "Generate 3 profiles"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={
                  approveProfiles.isPending ||
                  selectedCount === 0 ||
                  !canAffordApprove
                }
                onClick={() => void handleApprove()}
              >
                {approveProfiles.isPending
                  ? "Saving…"
                  : `Save ${selectedCount} profile${selectedCount === 1 ? "" : "s"}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
