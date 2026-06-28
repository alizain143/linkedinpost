"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appLabel } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { Button, toggleVariant } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import {
  useCouncilMutation,
  useGenerationJob,
  useQuickDraftMutation,
} from "@/hooks/api/use-generation-api";
import { useCreatePost } from "@/hooks/api/use-posts-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { approvePost, fetchPost, transitionPostStatus } from "@/lib/api/posts";
import type { QuickDraftVariant } from "@/lib/api/types/generation";
import type { PostType } from "@/lib/api/types/enums";
import {
  COUNCIL_CREDIT_COST,
  QUICK_DRAFT_CREDIT_COST,
  getGenerationModeCost,
} from "@/lib/credit-costs";
import { isCreditsExhaustedError } from "@/lib/credits-errors";
import { shouldPollJob } from "@/lib/council-utils";
import { POST_TYPE_SELECT_OPTIONS, getPostTypeLabel } from "@/lib/post-types";
import { TONE_OPTIONS } from "@/lib/form-options";
import {
  countWords,
  variantToCreatePostBody,
} from "@/lib/generation-utils";
import { CouncilTimeline } from "@/components/sections/app/generate/CouncilTimeline";
import { useAppUi } from "@/providers/app-ui-provider";
import { useAuth } from "@clerk/nextjs";

type GenModeId = "quick" | "council" | "media";

const GEN_MODES: Array<{
  id: GenModeId;
  label: string;
  icon: string;
  desc: string;
  disabled?: boolean;
}> = [
  { id: "quick", label: "Quick Draft", icon: "bolt", desc: "1 credit · fast" },
  {
    id: "council",
    label: "AI Council",
    icon: "groups",
    desc: "3 credits · reviewed",
  },
  {
    id: "media",
    label: "Post + Media",
    icon: "auto_awesome_motion",
    desc: "10 credits · full",
    disabled: true,
  },
];

type GenerateFormState = {
  contentProfileId: string;
  postType: PostType;
  tone: string;
  topic: string;
  pillar: string;
  additionalContext: string;
  brief: string;
};

export default function Generate() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const {
    showToast,
    openSchedule,
    confirmPublishNow,
  } = useAppUi();
  const { balance, canAfford } = useCredits();

  const {
    data: profiles,
    isLoading: profilesLoading,
    error: profilesError,
    refetch: refetchProfiles,
  } = useContentProfiles(activeWorkspaceId);

  const quickDraft = useQuickDraftMutation(activeWorkspaceId);
  const councilMutation = useCouncilMutation(activeWorkspaceId);
  const createPost = useCreatePost(activeWorkspaceId);

  const [mode, setMode] = useState<GenModeId>("quick");
  const [activeCouncilJobId, setActiveCouncilJobId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<GenerateFormState>({
    contentProfileId: "",
    postType: "personal_story",
    tone: TONE_OPTIONS[0],
    topic: "",
    pillar: "",
    additionalContext: "",
    brief: "",
  });
  const [variants, setVariants] = useState<QuickDraftVariant[]>([]);
  const [generated, setGenerated] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<number, string>>({});
  const [savingVariantIndex, setSavingVariantIndex] = useState<number | null>(
    null,
  );
  const [actionVariantIndex, setActionVariantIndex] = useState<number | null>(
    null,
  );

  const councilJob = useGenerationJob(activeCouncilJobId, {
    poll: true,
    workspaceId: activeWorkspaceId,
    onCompleted: (job) => {
      showToast("Council review complete", "check_circle");
      if (job.postPackageId) {
        router.push(`/app/posts/${job.postPackageId}`);
      }
    },
  });

  const initializedWorkspaceRef = useRef<string | null>(null);

  const selectedProfile = useMemo(
    () => profiles?.find((profile) => profile.id === form.contentProfileId),
    [profiles, form.contentProfileId],
  );

  const profileOptions = useMemo(
    () =>
      profiles?.map((profile) => ({
        value: profile.id,
        label: profile.isDefault ? `${profile.name} (Default)` : profile.name,
      })) ?? [],
    [profiles],
  );

  const pillarOptions = useMemo(() => {
    const pillars = selectedProfile?.pillars ?? [];
    if (pillars.length === 0) {
      return [{ value: "", label: "No pillars on profile" }];
    }
    return [
      { value: "", label: "Any pillar" },
      ...pillars.map((pillar) => ({ value: pillar.name, label: pillar.name })),
    ];
  }, [selectedProfile]);

  useEffect(() => {
    if (!activeWorkspaceId || !profiles) return;

    if (initializedWorkspaceRef.current !== activeWorkspaceId) {
      initializedWorkspaceRef.current = activeWorkspaceId;
      setVariants([]);
      setGenerated(false);
      setGenerateError(null);
      setSavedPostIds({});
      setActiveCouncilJobId(null);

      if (profiles.length === 0) {
        setForm((current) => ({ ...current, contentProfileId: "", pillar: "" }));
        return;
      }

      const defaultProfile =
        profiles.find((profile) => profile.isDefault) ?? profiles[0];
      setForm((current) => ({
        ...current,
        contentProfileId: defaultProfile.id,
        tone: defaultProfile.preferredTone ?? TONE_OPTIONS[0],
        pillar: "",
      }));
    }
  }, [activeWorkspaceId, profiles]);

  const handleProfileChange = (contentProfileId: string) => {
    const profile = profiles?.find((item) => item.id === contentProfileId);
    setForm((current) => ({
      ...current,
      contentProfileId,
      pillar: "",
      tone: profile?.preferredTone ?? current.tone,
    }));
  };

  const modeCost = getGenerationModeCost(mode);
  const canAffordMode = canAfford(modeCost);
  const selectedMode = GEN_MODES.find((item) => item.id === mode) ?? GEN_MODES[0];
  const quickGenerating = quickDraft.isPending;
  const councilEnqueueing = councilMutation.isPending;
  const councilJobActive =
    !!activeCouncilJobId &&
    !!councilJob.data &&
    shouldPollJob(councilJob.data.status);
  const isCouncilRunning = councilEnqueueing || councilJobActive;
  const generating = mode === "quick" ? quickGenerating : councilEnqueueing;
  const formDisabled = isCouncilRunning;

  const canSubmitGenerate =
    form.topic.trim().length > 0 &&
    !!form.contentProfileId &&
    canAffordMode &&
    !generating &&
    !isCouncilRunning &&
    (profiles?.length ?? 0) > 0;

  const buildRequestBody = useCallback(() => {
    return {
      topic: form.topic.trim(),
      postType: form.postType,
      tone: form.tone || undefined,
      pillar: form.pillar || undefined,
      contentProfileId: form.contentProfileId || undefined,
      additionalContext: form.additionalContext.trim() || undefined,
    };
  }, [form]);

  const buildQuickDraftBody = buildRequestBody;

  const buildCouncilBody = useCallback(() => {
    return {
      ...buildRequestBody(),
      brief: form.brief.trim() || undefined,
    };
  }, [buildRequestBody, form.brief]);

  const runGenerate = async () => {
    if (!canAffordMode) {
      showToast(
        `You need ${modeCost} credits to run ${selectedMode.label}. Upgrade your plan to keep generating.`,
        "error",
      );
      router.push("/app/billing");
      return;
    }

    if (!form.topic.trim()) {
      showToast("Enter a topic before generating.", "error");
      return;
    }

    if (!form.contentProfileId) {
      showToast("Select a content profile before generating.", "error");
      return;
    }

    setGenerateError(null);

    if (mode === "quick") {
      setGenerated(false);
      setSavedPostIds({});

      try {
        const job = await quickDraft.mutateAsync(buildQuickDraftBody());
        const nextVariants =
          job.result && "variants" in job.result ? job.result.variants : [];
        setVariants(nextVariants);
        setGenerated(nextVariants.length > 0);
        if (nextVariants.length === 0) {
          showToast("Generation finished but returned no variants.", "error");
        }
      } catch (err) {
        const message = getApiErrorMessage(err);
        setGenerateError(message);
        showToast(message, "error");
        if (isCreditsExhaustedError(err)) {
          router.push("/app/billing");
        }
      }
      return;
    }

    if (mode === "council") {
      setActiveCouncilJobId(null);

      try {
        const job = await councilMutation.mutateAsync(buildCouncilBody());
        setActiveCouncilJobId(job.id);
      } catch (err) {
        const message = getApiErrorMessage(err);
        setGenerateError(message);
        showToast(message, "error");
        if (isCreditsExhaustedError(err)) {
          router.push("/app/billing");
        }
      }
    }
  };

  const handleModeClick = (nextMode: GenModeId) => {
    const config = GEN_MODES.find((item) => item.id === nextMode);
    if (config?.disabled) {
      showToast("Coming soon in the next release.", "upcoming");
      return;
    }
    setMode(nextMode);
    setGenerateError(null);
    setVariants([]);
    setGenerated(false);
    setSavedPostIds({});
    setActiveCouncilJobId(null);
  };

  const getFormContext = () => ({
    topic: form.topic,
    contentProfileId: form.contentProfileId || undefined,
  });

  const ensureSavedAndApproved = async (
    variantIndex: number,
  ): Promise<{ postId: string; hook: string }> => {
    const variant = variants[variantIndex];
    if (!variant) {
      throw new Error("Variant not found");
    }

    if (!activeWorkspaceId) {
      throw new Error("No active workspace");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    let postId = savedPostIds[variantIndex];

    if (!postId) {
      const post = await createPost.mutateAsync(
        variantToCreatePostBody(variant, getFormContext()),
      );
      postId = post.id;
      setSavedPostIds((current) => ({ ...current, [variantIndex]: postId }));
    }

    let post = await fetchPost(token, activeWorkspaceId, postId);

    if (post.status === "draft") {
      post = await transitionPostStatus(token, activeWorkspaceId, postId, {
        status: "ready_for_approval",
      });
    }

    if (post.status === "ready_for_approval") {
      post = await approvePost(token, activeWorkspaceId, postId);
    }

    if (post.status !== "approved" && post.status !== "scheduled") {
      throw new Error("Post must be approved before scheduling or publishing.");
    }

    return { postId, hook: variant.hook };
  };

  const handleSaveDraft = async (variantIndex: number) => {
    const variant = variants[variantIndex];
    if (!variant) return;

    setSavingVariantIndex(variantIndex);
    try {
      const post = await createPost.mutateAsync(
        variantToCreatePostBody(variant, getFormContext()),
      );
      setSavedPostIds((current) => ({ ...current, [variantIndex]: post.id }));
      showToast("Saved to drafts", "bookmark_added");
      router.push(`/app/posts/${post.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSavingVariantIndex(null);
    }
  };

  const handleSchedule = async (variantIndex: number) => {
    setActionVariantIndex(variantIndex);
    try {
      const target = await ensureSavedAndApproved(variantIndex);
      openSchedule({ ...target, mode: "schedule" });
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActionVariantIndex(null);
    }
  };

  const handlePublishNow = async (variantIndex: number) => {
    setActionVariantIndex(variantIndex);
    try {
      const target = await ensureSavedAndApproved(variantIndex);
      confirmPublishNow(target);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActionVariantIndex(null);
    }
  };

  const pillVariant = (active: boolean) => toggleVariant(active);

  const formPanel = (
    <>
      <div className="mb-[18px] flex gap-2">
        {GEN_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleModeClick(m.id)}
            className={`flex flex-1 flex-col items-start gap-0.5 rounded-[11px] border p-2.5 text-left ${
              mode === m.id
                ? "border-[#4f46e5] bg-[#eef2ff]"
                : m.disabled
                  ? "cursor-not-allowed border-[#e3e6ef] bg-[#fafbfd] opacity-70"
                  : "border-[#e3e6ef] bg-white hover:bg-[#f6f7fb]"
            }`}
          >
            <MsIcon
              name={m.icon}
              size={20}
              className={mode === m.id ? "text-[#4f46e5]" : "text-[#94a3b8]"}
            />
            <span
              className={`text-[12.5px] font-bold leading-tight ${
                mode === m.id ? "text-[#4338ca]" : "text-[#1e293b]"
              }`}
            >
              {m.label}
            </span>
            <span className="text-[10.5px] leading-tight text-[#94a3b8]">
              {m.disabled ? "Coming soon" : m.desc}
            </span>
          </button>
        ))}
      </div>

      {!canAffordMode && balance ? (
        <div className="mb-4 rounded-[11px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[13px] text-[#92400e]">
          You need {modeCost} credits to run {selectedMode.label}.{" "}
          <Link href="/app/billing" className="font-semibold text-[#4f46e5]">
            Upgrade plan
          </Link>
        </div>
      ) : null}

      <SelectField
        label="Content profile"
        fieldClassName="mb-4"
        options={profileOptions}
        value={form.contentProfileId}
        onChange={(event) => handleProfileChange(event.target.value)}
        disabled={profileOptions.length === 0 || formDisabled}
      />

      <label className={appLabel}>Post type</label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {POST_TYPE_SELECT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={pillVariant(form.postType === option.value)}
            size="xs"
            onClick={() =>
              setForm((current) => ({ ...current, postType: option.value }))
            }
            disabled={formDisabled}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <label className={appLabel}>Tone</label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TONE_OPTIONS.map((tn) => (
          <Button
            key={tn}
            type="button"
            variant={pillVariant(form.tone === tn)}
            size="xs"
            onClick={() => setForm((current) => ({ ...current, tone: tn }))}
            disabled={formDisabled}
          >
            {tn}
          </Button>
        ))}
      </div>

      <InputField
        label="Topic"
        fieldClassName="mb-4"
        value={form.topic}
        maxLength={500}
        placeholder="A hard lesson from scaling my team"
        onChange={(event) =>
          setForm((current) => ({ ...current, topic: event.target.value }))
        }
        disabled={formDisabled}
      />

      <SelectField
        label="Content pillar"
        fieldClassName="mb-4"
        selectClassName="text-[13px]"
        options={pillarOptions}
        value={form.pillar}
        onChange={(event) =>
          setForm((current) => ({ ...current, pillar: event.target.value }))
        }
        disabled={(pillarOptions.length <= 1 && !form.pillar) || formDisabled}
      />

      <TextareaField
        label="Notes"
        hint="(optional)"
        fieldClassName="mb-4"
        className="h-16"
        value={form.additionalContext}
        placeholder="Drop a rough idea, a bullet, or paste a note to repurpose…"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            additionalContext: event.target.value,
          }))
        }
        disabled={formDisabled}
      />

      {mode === "council" ? (
        <TextareaField
          label="Brief"
          hint="(optional)"
          fieldClassName="mb-4"
          className="h-24"
          value={form.brief}
          maxLength={5000}
          placeholder="Add extra direction for the council — audience, angle, key points…"
          onChange={(event) =>
            setForm((current) => ({ ...current, brief: event.target.value }))
          }
          disabled={formDisabled}
        />
      ) : null}

      <Button
        type="button"
        variant="gradient"
        size="lg"
        fullWidth
        onClick={() => void runGenerate()}
        disabled={!canSubmitGenerate}
      >
        <MsIcon name="auto_awesome" size={19} />
        {isCouncilRunning
          ? "Council running…"
          : generating
            ? "Starting…"
            : `Generate with ${selectedMode.label}`}
      </Button>
    </>
  );

  return (
    <div className="pp-gen">
      <div className="sticky top-[90px] rounded-[18px] border border-[#eceef4] bg-white p-[22px]">
        <div className="mb-[18px] flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
            <MsIcon name="auto_awesome" size={21} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold">Post generator</h2>
            <p className="text-[12.5px] text-[#94a3b8]">
              {mode === "council"
                ? "Run the AI Council for a reviewed post with media."
                : "Pick a mode, then generate polished drafts."}
            </p>
          </div>
        </div>

        <QueryState
          isLoading={profilesLoading}
          error={profilesError}
          isEmpty={(profiles?.length ?? 0) === 0}
          empty={
            <div className="rounded-[12px] border border-dashed border-[#d8dce8] bg-[#fbfbfd] px-4 py-5 text-center">
              <p className="mb-3 text-[13px] leading-relaxed text-[#64748b]">
                Create a content profile before generating posts.
              </p>
              <Link
                href="/app/profile"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5]"
              >
                Set up content profile
                <MsIcon name="arrow_forward" size={16} />
              </Link>
            </div>
          }
          onRetry={() => void refetchProfiles()}
        >
          {formPanel}
        </QueryState>
      </div>

      <div>
        {generateError && !generating && !generated && !activeCouncilJobId ? (
          <div className="mb-4 rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[13px] text-[#b91c1c]">
            {generateError}
          </div>
        ) : null}

        {mode === "council" ? (
          isCouncilRunning && !councilJob.data ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#4f46e5]">
                <MsIcon name="progress_activity" size={20} className="animate-ppspin" />
                Starting AI Council…
              </div>
              <div className="rounded-2xl border border-[#eceef4] bg-white p-[22px]">
                <div className="animate-ppshimmer mb-4 h-3.5 w-[60%] rounded-md" />
                <div className="animate-ppshimmer mb-2 h-2.5 w-full rounded-md" />
                <div className="animate-ppshimmer h-2.5 w-[80%] rounded-md" />
              </div>
            </div>
          ) : activeCouncilJobId && councilJob.data ? (
            <CouncilTimeline
              events={councilJob.data.events ?? []}
              progress={councilJob.data.progress}
              status={councilJob.data.status}
              errorMessage={councilJob.data.errorMessage}
            />
          ) : (
            <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#d8dce8] bg-white px-8 py-14 text-center">
              <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#eef2ff] to-[#ecfeff]">
                <MsIcon name="groups" size={34} className="text-[#4f46e5]" />
              </div>
              <h3 className="mb-2 font-display text-[19px] font-bold">
                AI Council progress will appear here
              </h3>
              <p className="mb-[22px] max-w-[360px] text-[14.5px] leading-relaxed text-[#64748b]">
                Five agents will write, review, edit, and generate media — with
                live progress as each step completes.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => void runGenerate()}
                disabled={!canSubmitGenerate}
              >
                <MsIcon name="groups" size={18} />
                Run AI Council ({COUNCIL_CREDIT_COST} credits)
              </Button>
            </div>
          )
        ) : generating ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#4f46e5]">
              <MsIcon name="progress_activity" size={20} className="animate-ppspin" />
              Writing 3 posts in your voice…
            </div>
            {[1, 0.6].map((opacity, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#eceef4] bg-white p-[22px]"
                style={{ opacity }}
              >
                <div className="animate-ppshimmer mb-4 h-3.5 w-[60%] rounded-md" />
                <div className="animate-ppshimmer mb-2 h-2.5 w-full rounded-md" />
                <div className="animate-ppshimmer mb-2 h-2.5 w-[95%] rounded-md" />
                <div className="animate-ppshimmer h-2.5 w-[80%] rounded-md" />
              </div>
            ))}
          </div>
        ) : generated && variants.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#16a34a]">
                <MsIcon name="check_circle" size={19} />
                {variants.length} posts ready
              </div>
              <Button
                type="button"
                variant="muted"
                size="xs"
                onClick={() => void runGenerate()}
                disabled={!canSubmitGenerate}
              >
                <MsIcon name="refresh" size={16} />
                Regenerate ({QUICK_DRAFT_CREDIT_COST} credit)
              </Button>
            </div>
            {variants.map((variant, i) => {
              const wordCount = countWords(variant.hook, variant.body, variant.cta);
              const isSaving = savingVariantIndex === i;
              const isActing = actionVariantIndex === i;

              return (
                <div
                  key={`${variant.hook}-${i}`}
                  className="animate-ppscale overflow-hidden rounded-2xl border border-[#eceef4] bg-white shadow-[0_1px_3px_rgba(24,28,64,0.05)]"
                >
                  <div className="flex items-center justify-between border-b border-[#f1f3f8] bg-[#fbfbfd] px-[18px] py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
                      <MsIcon name="auto_awesome" size={13} />
                      AI DRAFT · OPTION {i + 1}
                    </span>
                    <span className="text-[11.5px] text-[#94a3b8]">
                      {wordCount} words
                    </span>
                  </div>
                  <div className="p-[18px]">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {getPostTypeLabel(variant.postType) ? (
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#475569]">
                          {getPostTypeLabel(variant.postType)}
                        </span>
                      ) : null}
                      {variant.tone ? (
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#475569]">
                          {variant.tone}
                        </span>
                      ) : null}
                      {variant.pillar ? (
                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#475569]">
                          {variant.pillar}
                        </span>
                      ) : null}
                    </div>
                    <p className="mb-3 font-display text-[16.5px] font-bold leading-snug tracking-[-0.01em] text-[#0f172a]">
                      {variant.hook}
                    </p>
                    <p className="mb-3.5 whitespace-pre-wrap text-sm leading-relaxed text-[#3f4a5e]">
                      {variant.body}
                    </p>
                    <div className="mb-3.5 rounded-[11px] border-l-[3px] border-[#4f46e5] bg-[#f6f7fb] px-3.5 py-3">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#4f46e5]">
                        Call to action
                      </span>
                      <span className="text-[13.5px] font-medium leading-snug text-[#1e293b]">
                        {variant.cta}
                      </span>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {variant.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[12.5px] font-semibold text-[#0891b2]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isSaving || isActing || createPost.isPending}
                        onClick={() => void handleSaveDraft(i)}
                      >
                        <MsIcon name="bookmark_add" size={16} style={{ color: "#7c3aed" }} />
                        {isSaving ? "Saving…" : "Save Draft"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled
                      >
                        <MsIcon name="rate_review" size={16} style={{ color: "#0891b2" }} />
                        Send to Review
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled>
                        <MsIcon name="image" size={16} style={{ color: "#c026d3" }} />
                        Generate Media
                      </Button>
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        disabled={isSaving || isActing}
                        onClick={() => void handleSchedule(i)}
                      >
                        <MsIcon name="event_available" size={16} />
                        {isActing ? "Preparing…" : "Approve & Schedule"}
                      </Button>
                      <Button
                        type="button"
                        variant="linkedin"
                        size="sm"
                        disabled={isSaving || isActing}
                        onClick={() => void handlePublishNow(i)}
                      >
                        <MsIcon name="send" size={16} />
                        {isActing ? "Preparing…" : "Approve & Post Now"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#d8dce8] bg-white px-8 py-14 text-center">
            <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#eef2ff] to-[#ecfeff]">
              <MsIcon name="auto_awesome" size={34} className="text-[#4f46e5]" />
            </div>
            <h3 className="mb-2 font-display text-[19px] font-bold">
              Your posts will appear here
            </h3>
            <p className="mb-[22px] max-w-[340px] text-[14.5px] leading-relaxed text-[#64748b]">
              Set your tone and topic on the left, then generate three polished,
              ready-to-post LinkedIn drafts.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void runGenerate()}
              disabled={!canSubmitGenerate}
            >
              <MsIcon name="auto_awesome" size={18} />
              Generate 3 Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
