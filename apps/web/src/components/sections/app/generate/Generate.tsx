"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { SelectField } from "@/components/ui/select";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import {
  useComparePickMutation,
  useCouncilMutation,
  useGenerationJob,
  useQuickDraftMutation,
  useQuickDraftSingleMutation,
  useTopicSuggestionsMutation,
} from "@/hooks/api/use-generation-api";
import {
  useApplyPostChangesMutation,
  useCreatePost,
  useDeletePost,
  useGeneratePostMediaMutation,
  usePost,
} from "@/hooks/api/use-posts-api";
import { useMediaTemplates } from "@/hooks/api/use-media-templates-api";
import { updatePost } from "@/lib/api/posts";
import { CreditConfirmModal } from "@/components/modals/credit-confirm-modal";
import {
  GenerateMediaModal,
  type GenerateMediaModalValues,
} from "@/components/modals/generate-media-modal";
import { PromptModal } from "@/components/modals/prompt-modal";
import { VoiceMicButton } from "@/components/ui/voice-mic-button";
import { copyPostToClipboard } from "@/lib/copy-post";
import { trackProductEvent } from "@/lib/product-events";
import {
  isSpeechSynthesisSupported,
  pauseSpeech,
  resumeSpeech,
  speakPost,
  stopSpeech,
  type SpeechPlaybackState,
} from "@/lib/speech/tts";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import { approvePost, fetchPost, transitionPostStatus } from "@/lib/api/posts";
import type { QuickDraftVariant, TopicSuggestion } from "@/lib/api/types/generation";
import type { PostType } from "@/lib/api/types/enums";
import {
  COUNCIL_CREDIT_COST,
  QUICK_DRAFT_CREDIT_COST,
  getGenerationModeCost,
  resolveCouncilCreditCost,
  resolveMediaGenerationCreditCost,
} from "@/lib/credit-costs";
import {
  MediaFormatFields,
  mediaFormatValuesToRequestBody,
} from "@/components/ui/media-format-fields";
import type { MediaFormat } from "@/lib/api/types/media-template";
import {
  buildMediaTemplateSelectOptions,
  resolveDefaultMediaTemplateId,
} from "@/lib/media-template-options";
import { isCreditsExhaustedError } from "@/lib/credits-errors";
import { shouldPollJob } from "@/lib/council-utils";
import { POST_TYPE_SELECT_OPTIONS, getPostTypeLabel } from "@/lib/post-types";
import { TONE_OPTIONS } from "@/lib/form-options";
import {
  countWords,
  variantToCreatePostBody,
} from "@/lib/generation-utils";
import { CouncilTimeline } from "@/components/sections/app/generate/CouncilTimeline";
import { LinkedInFeedPreview } from "@/components/sections/app/generate/LinkedInFeedPreview";
import {
  PostMediaCarouselViewer,
  PostMediaImage,
} from "@/components/ui/post-media-image";
import { MediaGeneratingSkeleton } from "@/components/ui/media-generating-skeleton";
import { GenerationHistoryPanel } from "@/components/sections/app/generate/GenerationHistoryPanel";
import {
  TopicMagicButton,
  TopicSuggestionsPicker,
} from "@/components/sections/app/generate/TopicSuggestionsPicker";
import { useAppUi } from "@/providers/app-ui-provider";
import { useAuth } from "@clerk/nextjs";
import {
  addGenerationHistoryEntry,
  buildTopicFingerprint,
  isQuickDraftSessionStale,
  loadGenerationSession,
  saveGenerationSession,
  type GenerationHistoryEntry,
  type StoredQuickDraftSession,
} from "@/lib/generation-session";

type GenModeId = "quick" | "council";

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
    desc: "3 credits · reviewed post + image",
  },
];

type GenerateFormState = {
  contentProfileId: string;
  postType: PostType;
  tone: string;
  customTone: string;
  useCustomTone: boolean;
  topic: string;
  pillar: string;
  additionalContext: string;
  brief: string;
  mediaCustomPrompt: string;
  mediaTemplateId: string;
  mediaFormat: MediaFormat;
  carouselSlideCount: number | null;
  carouselStyle: "template" | "freestyle";
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
  const quickDraftSingle = useQuickDraftSingleMutation(activeWorkspaceId);
  const topicSuggestionsMutation = useTopicSuggestionsMutation(activeWorkspaceId);
  const comparePickMutation = useComparePickMutation(activeWorkspaceId);
  const councilMutation = useCouncilMutation(activeWorkspaceId);
  const { data: mediaTemplatesData } = useMediaTemplates(activeWorkspaceId);
  const generatePostMedia = useGeneratePostMediaMutation(activeWorkspaceId);
  const applyPostChanges = useApplyPostChangesMutation(activeWorkspaceId);
  const createPost = useCreatePost(activeWorkspaceId);
  const deletePost = useDeletePost(activeWorkspaceId);

  const [mode, setMode] = useState<GenModeId>("quick");
  const [activeCouncilJobId, setActiveCouncilJobId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<GenerateFormState>({
    contentProfileId: "",
    postType: "personal_story",
    tone: TONE_OPTIONS[0],
    customTone: "",
    useCustomTone: false,
    topic: "",
    pillar: "",
    additionalContext: "",
    brief: "",
    mediaCustomPrompt: "",
    mediaTemplateId: "",
    mediaFormat: "single",
    carouselSlideCount: null,
    carouselStyle: "freestyle",
  });
  const [variants, setVariants] = useState<QuickDraftVariant[]>([]);
  const [originalVariants, setOriginalVariants] = useState<QuickDraftVariant[]>(
    [],
  );
  const [generated, setGenerated] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<number, string>>({});
  const [dismissedVariantIndices, setDismissedVariantIndices] = useState<number[]>(
    [],
  );
  const [undoDismissIndex, setUndoDismissIndex] = useState<number | null>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );
  const [speechPlayback, setSpeechPlayback] = useState<{
    variantIndex: number;
    state: Exclude<SpeechPlaybackState, "idle">;
  } | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [aiPick, setAiPick] = useState<{
    variantIndex: number;
    reason: string;
  } | null>(null);
  const [topicFingerprint, setTopicFingerprint] = useState<string | null>(null);
  const [staleSessionBanner, setStaleSessionBanner] = useState(false);
  const [skipCreditConfirm, setSkipCreditConfirm] = useState(false);
  const [creditConfirm, setCreditConfirm] = useState<{
    cost: number;
    label: string;
    onConfirm: () => void;
  } | null>(null);
  const [promptModal, setPromptModal] = useState<{
    kind: "regen" | "council-text";
    variantIndex?: number;
    value: string;
  } | null>(null);
  const [generateMediaModal, setGenerateMediaModal] = useState<{
    kind: "variant" | "council";
    variantIndex?: number;
    values: GenerateMediaModalValues;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [variantPostStatuses, setVariantPostStatuses] = useState<
    Record<number, string>
  >({});
  const [savingVariantIndex, setSavingVariantIndex] = useState<number | null>(
    null,
  );
  const [actionVariantIndex, setActionVariantIndex] = useState<number | null>(
    null,
  );
  const [reviewVariantIndex, setReviewVariantIndex] = useState<number | null>(
    null,
  );
  const [mediaVariantIndex, setMediaVariantIndex] = useState<number | null>(
    null,
  );
  const [regeneratingVariantIndex, setRegeneratingVariantIndex] = useState<
    number | null
  >(null);
  const [activeMediaJobId, setActiveMediaJobId] = useState<string | null>(null);
  const [variantMediaUrls, setVariantMediaUrls] = useState<Record<number, string>>(
    {},
  );
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>(
    [],
  );

  const councilCompletedRef = useRef<string | null>(null);
  const mediaCompletedRef = useRef<string | null>(null);
  const mediaVariantIndexRef = useRef<number | null>(null);
  mediaVariantIndexRef.current = mediaVariantIndex;
  const savedPostIdsRef = useRef(savedPostIds);
  savedPostIdsRef.current = savedPostIds;
  const variantMediaBaselineRef = useRef<Record<number, string>>({});
  const activeMediaJobIdRef = useRef<string | null>(null);
  activeMediaJobIdRef.current = activeMediaJobId;

  const beginVariantMediaGeneration = useCallback((variantIndex: number) => {
    setVariantMediaUrls((current) => {
      const previous = current[variantIndex];
      if (previous) {
        variantMediaBaselineRef.current = {
          ...variantMediaBaselineRef.current,
          [variantIndex]: previous,
        };
      } else {
        const nextBaseline = { ...variantMediaBaselineRef.current };
        delete nextBaseline[variantIndex];
        variantMediaBaselineRef.current = nextBaseline;
      }
      if (!(variantIndex in current)) return current;
      const next = { ...current };
      delete next[variantIndex];
      return next;
    });
    setMediaVariantIndex(variantIndex);
  }, []);

  const councilJob = useGenerationJob(activeCouncilJobId, {
    poll: true,
    workspaceId: activeWorkspaceId,
    onCompleted: (job) => {
      if (!activeWorkspaceId || councilCompletedRef.current === job.id) return;
      councilCompletedRef.current = job.id;
      const { created } = addGenerationHistoryEntry(activeWorkspaceId, {
        kind: "council",
        label: form.topic.trim() || "AI Council",
        topic: form.topic.trim(),
        councilJobId: job.id,
        councilPostId: job.postPackageId ?? undefined,
      });
      if (!created) return;
      showToast("Council review complete", "check_circle");
      setHistory(loadGenerationSession(activeWorkspaceId).history);
    },
  });

  const councilPostId = councilJob.data?.postPackageId ?? null;
  const councilPostQuery = usePost(activeWorkspaceId, councilPostId, {
    pollWhileAwaitingApproval: true,
  });

  const finishVariantMedia = useCallback(
    async (
      postPackageId: string,
      variantIndexHint: number | null,
    ): Promise<boolean> => {
      if (!activeWorkspaceId) return false;
      const token = await getToken();
      if (!token) return false;

      const post = await fetchPost(token, activeWorkspaceId, postPackageId);
      const url = post.media[0]?.url;
      const variantEntry = Object.entries(savedPostIdsRef.current).find(
        ([, postId]) => postId === postPackageId,
      );
      const resolvedVariantIndex =
        variantEntry != null ? Number(variantEntry[0]) : variantIndexHint;

      if (resolvedVariantIndex == null) return false;

      setVariantPostStatuses((current) => ({
        ...current,
        [resolvedVariantIndex]: post.status,
      }));

      if (!url) return false;

      const baseline = variantMediaBaselineRef.current[resolvedVariantIndex];
      if (baseline && url === baseline) {
        return false;
      }

      if (post.status === "media_generating") return false;

      const nextBaseline = { ...variantMediaBaselineRef.current };
      delete nextBaseline[resolvedVariantIndex];
      variantMediaBaselineRef.current = nextBaseline;

      setVariantMediaUrls((current) => ({
        ...current,
        [resolvedVariantIndex]: url,
      }));
      setMediaVariantIndex((current) =>
        current === resolvedVariantIndex ? null : current,
      );
      setActiveMediaJobId(null);

      return true;
    },
    [activeWorkspaceId, getToken],
  );

  const mediaJob = useGenerationJob(activeMediaJobId, {
    poll: true,
    workspaceId: activeWorkspaceId,
    onCompleted: async (job) => {
      if (!activeWorkspaceId || mediaCompletedRef.current === job.id) return;
      mediaCompletedRef.current = job.id;

      if (job.postPackageId) {
        const ready = await finishVariantMedia(
          job.postPackageId,
          mediaVariantIndexRef.current,
        );
        if (ready) {
          showToast("Media ready", "image");
        } else {
          setActiveMediaJobId(null);
        }
      } else {
        setActiveMediaJobId(null);
        setMediaVariantIndex(null);
      }

      if (job.postPackageId && job.postPackageId === councilPostId) {
        void councilPostQuery.refetch();
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

  const mediaTemplateOptions = useMemo(
    () => buildMediaTemplateSelectOptions(mediaTemplatesData),
    [mediaTemplatesData],
  );

  useEffect(() => {
    if (!mediaTemplatesData) return;
    const defaultId = resolveDefaultMediaTemplateId(mediaTemplatesData);
    if (!defaultId) return;
    setForm((current) =>
      current.mediaTemplateId ? current : { ...current, mediaTemplateId: defaultId },
    );
  }, [mediaTemplatesData]);

  const effectiveTone = form.useCustomTone ? form.customTone : form.tone;

  const buildGenerateMediaModalValues = useCallback(
    (): GenerateMediaModalValues => ({
      mediaTemplateId: form.mediaTemplateId,
      mediaFormat: form.mediaFormat,
      carouselSlideCount: form.carouselSlideCount,
      carouselStyle: form.carouselStyle,
      direction: form.mediaCustomPrompt,
    }),
    [
      form.mediaTemplateId,
      form.mediaFormat,
      form.carouselSlideCount,
      form.carouselStyle,
      form.mediaCustomPrompt,
    ],
  );

  const restoreQuickDraft = useCallback((snapshot: StoredQuickDraftSession) => {
    setVariants(snapshot.variants);
    setOriginalVariants(snapshot.originalVariants ?? snapshot.variants);
    setGenerated(snapshot.variants.length > 0);
    setSavedPostIds(snapshot.savedPostIds);
    setDismissedVariantIndices(snapshot.dismissedVariantIndices ?? []);
    setForm((current) => ({
      ...current,
      topic: snapshot.topic,
      contentProfileId: snapshot.contentProfileId,
      postType: snapshot.postType as PostType,
      tone: snapshot.tone,
      pillar: snapshot.pillar,
    }));
    setMode("quick");
    setGenerateError(null);
    setStaleSessionBanner(isQuickDraftSessionStale(snapshot));
  }, []);

  const currentTopicFingerprint = useMemo(
    () =>
      buildTopicFingerprint({
        contentProfileId: form.contentProfileId,
        postType: form.postType,
        tone: form.useCustomTone ? form.customTone : form.tone,
        pillar: form.pillar,
        additionalContext: form.additionalContext,
      }),
    [form],
  );

  const topicsStale =
    topicSuggestions.length > 0 &&
    !!topicFingerprint &&
    topicFingerprint !== currentTopicFingerprint;

  const requestCreditAction = useCallback(
    (cost: number, label: string, action: () => void) => {
      if (skipCreditConfirm) {
        action();
        return;
      }
      setCreditConfirm({ cost, label, onConfirm: action });
    },
    [skipCreditConfirm],
  );

  useEffect(() => {
    if (!activeWorkspaceId || !profiles) return;

    if (initializedWorkspaceRef.current !== activeWorkspaceId) {
      initializedWorkspaceRef.current = activeWorkspaceId;
      const session = loadGenerationSession(activeWorkspaceId);
      setHistory(session.history);
      // Jobs already in history must not re-fire onCompleted after remount.
      if (
        session.activeCouncilJobId &&
        session.history.some(
          (entry) => entry.councilJobId === session.activeCouncilJobId,
        )
      ) {
        councilCompletedRef.current = session.activeCouncilJobId;
      }
      setActiveCouncilJobId(session.activeCouncilJobId);
      setActiveMediaJobId(session.activeMediaJobId ?? null);
      setMediaVariantIndex(
        session.mediaVariantIndex != null ? session.mediaVariantIndex : null,
      );
      setMode(session.mode === "council" ? "council" : "quick");
      setSkipCreditConfirm(session.skipCreditConfirm ?? false);

      if (session.topicSuggestions) {
        setTopicSuggestions(session.topicSuggestions.suggestions);
        setTopicFingerprint(session.topicSuggestions.fingerprint);
      } else {
        setTopicSuggestions([]);
        setTopicFingerprint(null);
      }

      if (session.quickDraft) {
        restoreQuickDraft(session.quickDraft);
      } else {
        setVariants([]);
        setOriginalVariants([]);
        setGenerated(false);
        setSavedPostIds({});
        setDismissedVariantIndices([]);
        setVariantPostStatuses({});
        setStaleSessionBanner(false);
      }

      setGenerateError(null);

      if (profiles.length === 0) {
        setForm((current) => ({ ...current, contentProfileId: "", pillar: "" }));
        return;
      }

      if (!session.quickDraft) {
        const defaultProfile =
          profiles.find((profile) => profile.isDefault) ?? profiles[0];
        setForm((current) => ({
          ...current,
          contentProfileId: defaultProfile.id,
          tone: defaultProfile.preferredTone ?? TONE_OPTIONS[0],
          pillar: "",
        }));
      }
    }
  }, [activeWorkspaceId, profiles, restoreQuickDraft]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const entries = Object.entries(savedPostIds).filter(
      ([index]) => !dismissedVariantIndices.includes(Number(index)),
    );
    if (entries.length === 0) return;

    let cancelled = false;

    void (async () => {
      const token = await getToken();
      if (!token || cancelled) return;

      const statuses: Record<number, string> = {};
      const mediaUrls: Record<number, string> = {};
      let generatingVariantIndex: number | null = null;
      await Promise.all(
        entries.map(async ([index, postId]) => {
          try {
            const post = await fetchPost(token, activeWorkspaceId, postId);
            const variantIndex = Number(index);
            statuses[variantIndex] = post.status;
            if (post.media[0]?.url && post.status !== "media_generating") {
              mediaUrls[variantIndex] = post.media[0].url;
            }
            if (post.status === "media_generating") {
              generatingVariantIndex = variantIndex;
            }
          } catch {
            // ignore fetch errors for status hints
          }
        }),
      );

      if (!cancelled) {
        setVariantPostStatuses((current) => ({ ...current, ...statuses }));
        if (Object.keys(mediaUrls).length > 0) {
          setVariantMediaUrls((current) => {
            const next = { ...current, ...mediaUrls };
            const pending = mediaVariantIndexRef.current;
            if (pending != null) delete next[pending];
            return next;
          });
        }
        if (generatingVariantIndex != null) {
          setMediaVariantIndex((current) => current ?? generatingVariantIndex);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, dismissedVariantIndices, getToken, savedPostIds]);

  const generatingVariantIndicesKey = useMemo(() => {
    return Object.entries(variantPostStatuses)
      .filter(
        ([index, status]) =>
          status === "media_generating" &&
          !dismissedVariantIndices.includes(Number(index)),
      )
      .map(([index]) => index)
      .sort()
      .join(",");
  }, [dismissedVariantIndices, variantPostStatuses]);

  useEffect(() => {
    if (!activeWorkspaceId || !generatingVariantIndicesKey) return;
    // Job hook polls when we have a job id; post polling is fallback only.
    if (activeMediaJobId) return;

    const indices = generatingVariantIndicesKey.split(",").map(Number);
    let cancelled = false;

    const pollGeneratingPosts = async () => {
      const token = await getToken();
      if (!token || cancelled) return;

      for (const index of indices) {
        const postId = savedPostIds[index];
        if (!postId) continue;

        try {
          const post = await fetchPost(token, activeWorkspaceId, postId);
          // Server may still be draft while job enqueues — don't restore stale media.
          if (
            mediaVariantIndexRef.current === index &&
            post.status !== "media_generating"
          ) {
            continue;
          }

          setVariantPostStatuses((current) => {
            if (current[index] === post.status) return current;
            return { ...current, [index]: post.status };
          });

          if (post.status !== "media_generating" && post.media[0]?.url) {
            const url = post.media[0].url;
            setVariantMediaUrls((current) => {
              if (current[index] === url) return current;
              return { ...current, [index]: url };
            });
            setMediaVariantIndex((current) => (current === index ? null : current));
          } else if (post.status !== "media_generating") {
            setMediaVariantIndex((current) => (current === index ? null : current));
          }
        } catch {
          // ignore poll errors
        }
      }
    };

    void pollGeneratingPosts();
    const interval = setInterval(() => void pollGeneratingPosts(), 3_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    activeMediaJobId,
    activeWorkspaceId,
    generatingVariantIndicesKey,
    getToken,
    savedPostIds,
  ]);

  const pendingMediaVariantKey = useMemo(() => {
    if (mediaVariantIndex == null) return "";
    if (variantMediaUrls[mediaVariantIndex]) return "";
    return String(mediaVariantIndex);
  }, [mediaVariantIndex, variantMediaUrls]);

  useEffect(() => {
    if (!activeWorkspaceId || !pendingMediaVariantKey) return;

    const index = Number(pendingMediaVariantKey);
    let cancelled = false;

    const pollPendingVariant = async () => {
      const postId = savedPostIdsRef.current[index];
      if (!postId) return;
      const token = await getToken();
      if (!token || cancelled) return;

      // Wait for job enqueue before polling — server may still return pre-regen media.
      if (
        variantMediaBaselineRef.current[index] &&
        !activeMediaJobIdRef.current
      ) {
        return;
      }

      try {
        const ready = await finishVariantMedia(postId, index);
        if (ready) {
          showToast("Media ready", "image");
        }
      } catch {
        // ignore poll errors
      }
    };

    void pollPendingVariant();
    const interval = setInterval(() => void pollPendingVariant(), 3_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeMediaJobId, activeWorkspaceId, finishVariantMedia, getToken, pendingMediaVariantKey]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const existingSession = loadGenerationSession(activeWorkspaceId);
    const quickDraftSnapshot: StoredQuickDraftSession | null =
      generated && variants.length > 0
        ? {
            variants,
            originalVariants:
              originalVariants.length > 0 ? originalVariants : variants,
            savedPostIds,
            dismissedVariantIndices,
            topic: form.topic,
            contentProfileId: form.contentProfileId,
            postType: form.postType,
            tone: form.tone,
            pillar: form.pillar,
            createdAt:
              existingSession.quickDraft?.createdAt ?? new Date().toISOString(),
          }
        : existingSession.quickDraft;

    saveGenerationSession(activeWorkspaceId, {
      quickDraft: quickDraftSnapshot,
      activeCouncilJobId,
      activeMediaJobId,
      mediaVariantIndex,
      mode: mode === "council" ? "council" : "quick",
      topicSuggestions:
        topicSuggestions.length > 0 && topicFingerprint
          ? {
              suggestions: topicSuggestions,
              fingerprint: topicFingerprint,
              createdAt:
                existingSession.topicSuggestions?.createdAt ??
                new Date().toISOString(),
            }
          : existingSession.topicSuggestions,
      skipCreditConfirm,
    });
  }, [
    activeWorkspaceId,
    activeCouncilJobId,
    activeMediaJobId,
    mediaVariantIndex,
    form.contentProfileId,
    form.pillar,
    form.postType,
    form.tone,
    form.topic,
    generated,
    mode,
    savedPostIds,
    dismissedVariantIndices,
    variants,
    originalVariants,
    topicSuggestions,
    topicFingerprint,
    skipCreditConfirm,
  ]);

  const handleProfileChange = (contentProfileId: string) => {
    const profile = profiles?.find((item) => item.id === contentProfileId);
    setTopicSuggestions([]);
    setTopicFingerprint(null);
    if (activeWorkspaceId) {
      saveGenerationSession(activeWorkspaceId, { topicSuggestions: null });
    }
    setForm((current) => ({
      ...current,
      contentProfileId,
      pillar: "",
      tone: profile?.preferredTone ?? current.tone,
    }));
  };

  const handleSuggestTopics = async () => {
    if (!form.contentProfileId) {
      showToast("Select a content profile first.", "error");
      return;
    }

    try {
      const result = await topicSuggestionsMutation.mutateAsync({
        contentProfileId: form.contentProfileId || undefined,
        postType: form.postType,
        tone: (form.useCustomTone ? form.customTone : form.tone) || undefined,
        pillar: form.pillar || undefined,
        additionalContext: form.additionalContext.trim() || undefined,
      });
      const fingerprint = currentTopicFingerprint;
      setTopicSuggestions(result.suggestions);
      setTopicFingerprint(fingerprint);
      if (topicSuggestions.length > 0) {
        trackProductEvent("topic_suggestions_regenerated");
      }
      if (activeWorkspaceId) {
        saveGenerationSession(activeWorkspaceId, {
          topicSuggestions: {
            suggestions: result.suggestions,
            fingerprint,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  };

  const handleSelectTopicSuggestion = (suggestion: TopicSuggestion) => {
    setForm((current) => ({
      ...current,
      topic: suggestion.topic,
      ...(suggestion.pillar ? { pillar: suggestion.pillar } : {}),
    }));
  };

  const modeCost =
    mode === "council"
      ? resolveCouncilCreditCost({
          mediaFormat: form.mediaFormat,
          carouselSlideCount: form.carouselSlideCount,
        })
      : getGenerationModeCost(mode);
  const variantMediaCreditCost = resolveMediaGenerationCreditCost(
    mediaFormatValuesToRequestBody({
      mediaTemplateId: form.mediaTemplateId,
      mediaFormat: form.mediaFormat,
      carouselSlideCount: form.carouselSlideCount,
      carouselStyle: form.carouselStyle,
    }),
  );
  const canAffordMode = canAfford(modeCost);
  const selectedMode = GEN_MODES.find((item) => item.id === mode) ?? GEN_MODES[0];
  const quickGenerating = quickDraft.isPending;
  const councilEnqueueing = councilMutation.isPending;
  const councilJobActive =
    !!activeCouncilJobId &&
    !!councilJob.data &&
    shouldPollJob(councilJob.data.status);
  const mediaJobActive =
    !!activeMediaJobId &&
    !!mediaJob.data &&
    shouldPollJob(mediaJob.data.status);
  const anyVariantMediaGenerating = useMemo(
    () =>
      mediaVariantIndex != null ||
      Object.entries(variantPostStatuses).some(
        ([index, status]) =>
          status === "media_generating" &&
          !dismissedVariantIndices.includes(Number(index)),
      ),
    [dismissedVariantIndices, mediaVariantIndex, variantPostStatuses],
  );
  const isCouncilRunning = councilEnqueueing || councilJobActive;
  const isMediaJobRunning =
    generatePostMedia.isPending || mediaJobActive || anyVariantMediaGenerating;
  const generating =
    mode === "quick" ? quickGenerating : councilEnqueueing;
  const formDisabled =
    isCouncilRunning || isMediaJobRunning || quickGenerating;

  const cardActionsDisabled =
    formDisabled ||
    quickDraftSingle.isPending ||
    regeneratingVariantIndex !== null ||
    applyPostChanges.isPending ||
    createPost.isPending ||
    savingVariantIndex !== null ||
    actionVariantIndex !== null ||
    reviewVariantIndex !== null;

  const councilJobComplete = councilJob.data?.status === "completed";
  const councilPostReady =
    councilJobComplete &&
    Boolean(councilPostQuery.data?.hook?.trim()) &&
    (councilPostQuery.data?.media ?? []).some((item) => item.url);
  const councilMediaGenerating =
    councilPostId != null &&
    (isCouncilRunning ||
      isMediaJobRunning ||
      (councilJobComplete &&
        Boolean(councilPostQuery.data?.hook?.trim()) &&
        !(councilPostQuery.data?.media ?? []).some((item) => item.url)));

  const canSubmitGenerate =
    form.topic.trim().length > 0 &&
    !!form.contentProfileId &&
    canAffordMode &&
    !generating &&
    !isCouncilRunning &&
    !isMediaJobRunning &&
    (profiles?.length ?? 0) > 0;

  const buildRequestBody = useCallback(() => {
    return {
      topic: form.topic.trim(),
      postType: form.postType,
      tone: effectiveTone || undefined,
      pillar: form.pillar || undefined,
      contentProfileId: form.contentProfileId || undefined,
      additionalContext: form.additionalContext.trim() || undefined,
      mediaCustomPrompt: form.mediaCustomPrompt.trim() || undefined,
      ...mediaFormatValuesToRequestBody({
        mediaFormat: form.mediaFormat,
        carouselSlideCount: form.carouselSlideCount,
        carouselStyle: form.carouselStyle,
        mediaTemplateId: form.mediaTemplateId,
      }),
    };
  }, [effectiveTone, form]);

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
      setDismissedVariantIndices([]);
      setVariantPostStatuses({});
      setVariantMediaUrls({});
      setOriginalVariants([]);
      setStaleSessionBanner(false);
      setAiPick(null);
      setCompareMode(false);
      stopSpeech();
      setSpeechPlayback(null);

      try {
        const job = await quickDraft.mutateAsync(buildQuickDraftBody());
        const nextVariants =
          job.result && "variants" in job.result ? job.result.variants : [];
        setVariants(nextVariants);
        setOriginalVariants(nextVariants);
        setGenerated(nextVariants.length > 0);
        if (nextVariants.length > 0 && activeWorkspaceId) {
          const snapshot: StoredQuickDraftSession = {
            variants: nextVariants,
            originalVariants: nextVariants,
            savedPostIds: {},
            dismissedVariantIndices: [],
            topic: form.topic.trim(),
            contentProfileId: form.contentProfileId,
            postType: form.postType,
            tone: form.tone,
            pillar: form.pillar,
            createdAt: new Date().toISOString(),
          };
          saveGenerationSession(activeWorkspaceId, { quickDraft: snapshot });
          addGenerationHistoryEntry(activeWorkspaceId, {
            kind: "quick_draft",
            label: `${nextVariants.length} variants`,
            topic: form.topic.trim(),
            variantCount: nextVariants.length,
            quickDraftSnapshot: snapshot,
          });
          setHistory(loadGenerationSession(activeWorkspaceId).history);
        }
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
        const body = buildCouncilBody();
        const job = await councilMutation.mutateAsync(body);
        setActiveCouncilJobId(job.id);
        councilCompletedRef.current = null;
        if (activeWorkspaceId) {
          saveGenerationSession(activeWorkspaceId, {
            activeCouncilJobId: job.id,
            mode: "council",
          });
        }
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
    if (nextMode === "quick" && activeWorkspaceId) {
      const session = loadGenerationSession(activeWorkspaceId);
      if (session.quickDraft) {
        restoreQuickDraft(session.quickDraft);
      }
    }
    if (activeWorkspaceId) {
      saveGenerationSession(activeWorkspaceId, {
        mode: nextMode === "council" ? "council" : "quick",
      });
    }
  };

  const handleRestoreHistory = (entry: GenerationHistoryEntry) => {
    if (entry.kind === "quick_draft" && entry.quickDraftSnapshot) {
      restoreQuickDraft(entry.quickDraftSnapshot);
      if (activeWorkspaceId) {
        saveGenerationSession(activeWorkspaceId, { quickDraft: entry.quickDraftSnapshot });
      }
      return;
    }
    if (entry.kind === "council") {
      setMode("council");
      if (entry.councilJobId) {
        // Mark handled so remount/onCompleted does not re-append history.
        councilCompletedRef.current = entry.councilJobId;
        setActiveCouncilJobId(entry.councilJobId);
        if (activeWorkspaceId) {
          saveGenerationSession(activeWorkspaceId, {
            activeCouncilJobId: entry.councilJobId,
            mode: "council",
          });
        }
      }
      if (entry.councilPostId) {
        router.push(`/app/posts/${entry.councilPostId}`);
      }
      return;
    }
    if (entry.kind === "calendar") {
      router.push("/app/generate/calendar");
    }
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

  const dismissVariant = (variantIndex: number) => {
    setDismissedVariantIndices((current) =>
      current.includes(variantIndex) ? current : [...current, variantIndex],
    );
  };

  const rejectVariant = async (variantIndex: number) => {
    const postId = savedPostIds[variantIndex];
    if (postId) {
      try {
        await deletePost.mutateAsync(postId);
      } catch (err) {
        showToast(getApiErrorMessage(err), "error");
        return;
      }
      setSavedPostIds((current) => {
        const next = { ...current };
        delete next[variantIndex];
        return next;
      });
    }
    dismissVariant(variantIndex);
    if (aiPick?.variantIndex === variantIndex) setAiPick(null);
    trackProductEvent("variant_rejected");
    setUndoDismissIndex(variantIndex);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoDismissIndex(null), 5000);
    showToast("1 option discarded · Undo available", "cancel");
  };

  const undoRejectVariant = () => {
    if (undoDismissIndex == null) return;
    setDismissedVariantIndices((current) =>
      current.filter((index) => index !== undoDismissIndex),
    );
    setUndoDismissIndex(null);
  };

  const handleCopyVariant = async (variantIndex: number) => {
    const variant = variants[variantIndex];
    if (!variant) return;
    try {
      await copyPostToClipboard(variant);
      trackProductEvent("variant_copied");
      showToast("Copied", "content_copy");
    } catch {
      showToast("Could not copy", "error");
    }
  };

  const handleToggleSpeak = (variantIndex: number) => {
    if (!isSpeechSynthesisSupported()) {
      showToast("Read aloud is not supported in this browser", "error");
      return;
    }
    const variant = variants[variantIndex];
    if (!variant) return;

    if (speechPlayback?.variantIndex === variantIndex) {
      if (speechPlayback.state === "playing") {
        pauseSpeech();
        setSpeechPlayback({ variantIndex, state: "paused" });
        return;
      }
      if (speechPlayback.state === "paused") {
        resumeSpeech();
        setSpeechPlayback({ variantIndex, state: "playing" });
        return;
      }
    }

    stopSpeech();
    // Optimistic UI so the icon flips immediately
    setSpeechPlayback({ variantIndex, state: "playing" });
    speakPost(
      {
        hook: variant.hook,
        body: variant.body,
        cta: variant.cta,
      },
      {
        onStart: () =>
          setSpeechPlayback({ variantIndex, state: "playing" }),
        onEnd: () =>
          setSpeechPlayback((current) =>
            current?.variantIndex === variantIndex ? null : current,
          ),
        onError: () =>
          setSpeechPlayback((current) =>
            current?.variantIndex === variantIndex ? null : current,
          ),
      },
    );
  };

  const handleResetVariant = (variantIndex: number) => {
    const original = originalVariants[variantIndex];
    if (!original) return;
    setVariants((current) =>
      current.map((variant, index) =>
        index === variantIndex ? original : variant,
      ),
    );
    setEditingVariantIndex(null);
  };

  const handleSaveVariantEdits = async (variantIndex: number) => {
    const variant = variants[variantIndex];
    const postId = savedPostIds[variantIndex];
    if (!variant) return;
    if (postId && activeWorkspaceId) {
      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        await updatePost(token, activeWorkspaceId, postId, {
          hook: variant.hook,
          body: variant.body,
          cta: variant.cta,
          tags: variant.tags,
        });
        showToast("Saved changes", "check_circle");
      } catch (err) {
        showToast(getApiErrorMessage(err), "error");
        return;
      }
    }
    setEditingVariantIndex(null);
  };

  const syncVariantToSavedPost = async (
    variantIndex: number,
    variant: QuickDraftVariant,
  ) => {
    const postId = savedPostIdsRef.current[variantIndex];
    if (!postId || !activeWorkspaceId) return;
    const token = await getToken();
    if (!token) return;
    const body = variantToCreatePostBody(variant, getFormContext());
    await updatePost(token, activeWorkspaceId, postId, {
      hook: body.hook,
      body: body.body,
      cta: body.cta,
      tags: body.tags,
      topic: body.topic,
      postType: body.postType,
      tone: body.tone,
      pillar: body.pillar,
      contentProfileId: body.contentProfileId,
    });
  };

  const runVariantRegen = async (variantIndex: number, revisionPrompt: string) => {
    const variant = variants[variantIndex];
    if (!variant) return;
    const savedPostIdBefore = savedPostIds[variantIndex] ?? null;
    setRegeneratingVariantIndex(variantIndex);
    try {
      const job = await quickDraftSingle.mutateAsync({
        ...buildQuickDraftBody(),
        revisionPrompt: revisionPrompt.trim() || undefined,
        previousVariant: {
          hook: variant.hook,
          body: variant.body,
          cta: variant.cta,
          tags: variant.tags,
        },
        avoidVariants: variants
          .filter((_, index) => index !== variantIndex)
          .map((item) => ({
            hook: item.hook,
            body: item.body,
            cta: item.cta,
            tags: item.tags,
          })),
      });
      const nextVariant =
        job.result && "variant" in job.result ? job.result.variant : null;
      if (!nextVariant) {
        showToast("Regeneration returned no draft", "error");
        return;
      }
      setVariants((current) =>
        current.map((item, index) =>
          index === variantIndex ? nextVariant : item,
        ),
      );
      setOriginalVariants((current) => {
        const next = [...current];
        next[variantIndex] = nextVariant;
        return next;
      });
      if (savedPostIdBefore) {
        await syncVariantToSavedPost(variantIndex, nextVariant);
      }
      if (aiPick?.variantIndex === variantIndex) setAiPick(null);
      trackProductEvent("variant_regenerated");
      showToast("Option regenerated", "auto_awesome");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
      if (isCreditsExhaustedError(err)) router.push("/app/billing");
    } finally {
      setRegeneratingVariantIndex(null);
    }
  };

  const getGenerateMediaDisabledReason = (
    variantIndex: number,
  ): string | null => {
    const status = variantPostStatuses[variantIndex];
    if (status && status !== "draft" && status !== "ready_for_approval") {
      return "Media can only be generated for draft or ready-for-approval posts.";
    }
    return null;
  };

  const handleSaveDraft = async (variantIndex: number) => {
    const variant = variants[variantIndex];
    if (!variant) return;

    setSavingVariantIndex(variantIndex);
    try {
      const postId = await ensureSavedPost(variantIndex);
      await syncVariantToSavedPost(variantIndex, variant);
      dismissVariant(variantIndex);
      showToast("Saved to drafts", "bookmark_added");
      router.push(`/app/posts/${postId}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSavingVariantIndex(null);
    }
  };

  const ensureSavedPost = async (variantIndex: number): Promise<string> => {
    const variant = variants[variantIndex];
    if (!variant) throw new Error("Variant not found");
    if (!activeWorkspaceId) throw new Error("No active workspace");

    let postId = savedPostIds[variantIndex];
    if (!postId) {
      const post = await createPost.mutateAsync(
        variantToCreatePostBody(variant, getFormContext()),
      );
      postId = post.id;
      setSavedPostIds((current) => ({ ...current, [variantIndex]: postId }));
    }
    return postId;
  };

  const handleSendToReview = async (variantIndex: number) => {
    const token = await getToken();
    if (!token || !activeWorkspaceId) {
      showToast("Not authenticated", "error");
      return;
    }

    setReviewVariantIndex(variantIndex);
    try {
      const postId = await ensureSavedPost(variantIndex);
      let post = await fetchPost(token, activeWorkspaceId, postId);

      if (post.status === "draft") {
        post = await transitionPostStatus(token, activeWorkspaceId, postId, {
          status: "ready_for_approval",
        });
      }

      showToast("Sent for review", "rate_review");
      dismissVariant(variantIndex);
      setVariantPostStatuses((current) => ({
        ...current,
        [variantIndex]: "ready_for_approval",
      }));
      router.push(`/app/posts/${post.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setReviewVariantIndex(null);
    }
  };

  const runGenerateMedia = async (
    variantIndex: number,
    options: {
      mediaCustomPrompt?: string;
      replace?: boolean;
      postType?: PostType;
      tone?: string;
      mediaFormat?: MediaFormat;
      carouselSlideCount?: number;
      mediaMode?: "freestyle" | "template";
      mediaTemplateId?: string;
    } = {},
  ) => {
    const creditCost = resolveMediaGenerationCreditCost({
      mediaFormat: options.mediaFormat ?? "single",
      mediaMode: options.mediaMode,
      carouselSlideCount: options.carouselSlideCount,
    });

    if (!canAfford(creditCost)) {
      showToast(`You need ${creditCost} credits to generate media.`, "error");
      router.push("/app/billing");
      return;
    }

    setMediaVariantIndex(variantIndex);
    try {
      const postId = await ensureSavedPost(variantIndex);
      const token = await getToken();
      if (!token || !activeWorkspaceId) throw new Error("Not authenticated");

      if (options.postType || options.tone) {
        await updatePost(token, activeWorkspaceId, postId, {
          ...(options.postType ? { postType: options.postType } : {}),
          ...(options.tone ? { tone: options.tone } : {}),
        });
      }

      mediaCompletedRef.current = null;
      const job = await generatePostMedia.mutateAsync({
        postId,
        mediaCustomPrompt: options.mediaCustomPrompt?.trim() || undefined,
        replace: options.replace,
        mediaFormat: options.mediaFormat ?? "single",
        ...(options.carouselSlideCount != null
          ? { carouselSlideCount: options.carouselSlideCount }
          : {}),
        mediaMode: options.mediaMode ?? "freestyle",
        ...(options.mediaTemplateId
          ? { mediaTemplateId: options.mediaTemplateId }
          : {}),
      });
      if (options.mediaCustomPrompt?.trim()) {
        trackProductEvent("media_generated_with_prompt");
      }
      setActiveMediaJobId(job.id);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
      setMediaVariantIndex(null);
      if (isCreditsExhaustedError(err)) {
        router.push("/app/billing");
      }
    }
  };

  const runCouncilGenerateMedia = async (options: {
    mediaCustomPrompt?: string;
    postType?: PostType;
    tone?: string;
    mediaFormat?: MediaFormat;
    carouselSlideCount?: number;
    mediaMode?: "freestyle" | "template";
    mediaTemplateId?: string;
  }) => {
    if (!councilPostId) return;

    const creditCost = resolveMediaGenerationCreditCost({
      mediaFormat: options.mediaFormat ?? "single",
      mediaMode: options.mediaMode,
      carouselSlideCount: options.carouselSlideCount,
    });

    if (!canAfford(creditCost)) {
      showToast(`You need ${creditCost} credits to generate media.`, "error");
      router.push("/app/billing");
      return;
    }

    try {
      const token = await getToken();
      if (!token || !activeWorkspaceId) throw new Error("Not authenticated");

      if (options.postType || options.tone) {
        await updatePost(token, activeWorkspaceId, councilPostId, {
          ...(options.postType ? { postType: options.postType } : {}),
          ...(options.tone ? { tone: options.tone } : {}),
        });
      }

      mediaCompletedRef.current = null;
      const job = await generatePostMedia.mutateAsync({
        postId: councilPostId,
        mediaCustomPrompt: options.mediaCustomPrompt?.trim() || undefined,
        replace: true,
        mediaFormat: options.mediaFormat ?? "single",
        ...(options.carouselSlideCount != null
          ? { carouselSlideCount: options.carouselSlideCount }
          : {}),
        mediaMode: options.mediaMode ?? "freestyle",
        ...(options.mediaTemplateId
          ? { mediaTemplateId: options.mediaTemplateId }
          : {}),
      });
      trackProductEvent("council_media_regenerated");
      setActiveMediaJobId(job.id);
      void councilPostQuery.refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
      if (isCreditsExhaustedError(err)) router.push("/app/billing");
    }
  };

  const handleGenerateMedia = (variantIndex: number) => {
    setGenerateMediaModal({
      kind: "variant",
      variantIndex,
      values: buildGenerateMediaModalValues(),
    });
  };

  const confirmGenerateMediaModal = () => {
    if (!generateMediaModal) return;
    const { kind, variantIndex, values } = generateMediaModal;
    setGenerateMediaModal(null);

    if (kind === "variant" && variantIndex != null) {
      beginVariantMediaGeneration(variantIndex);
    }

    setForm((current) => ({
      ...current,
      mediaTemplateId: values.mediaTemplateId,
      mediaFormat: values.mediaFormat,
      carouselSlideCount: values.carouselSlideCount,
      carouselStyle: values.carouselStyle,
      mediaCustomPrompt: values.direction,
    }));

    const mediaBody = mediaFormatValuesToRequestBody(values);
    const creditCost = resolveMediaGenerationCreditCost(mediaBody);
    const replace =
      kind === "council"
        ? true
        : variantIndex != null
          ? !!variantMediaUrls[variantIndex]
          : false;

    requestCreditAction(
      creditCost,
      replace ? "Regenerate image" : "Generate media",
      () => {
        const payload = {
          mediaCustomPrompt: values.direction,
          ...mediaBody,
          replace,
        };
        if (kind === "council") {
          void runCouncilGenerateMedia(payload);
        } else if (variantIndex != null) {
          void runGenerateMedia(variantIndex, payload);
        }
      },
    );
  };

  const confirmPromptModal = async () => {
    if (!promptModal) return;
    const value = promptModal.value;
    const variantIndex = promptModal.variantIndex;
    const kind = promptModal.kind;
    setPromptModal(null);

    if (kind === "regen" && variantIndex != null) {
      requestCreditAction(QUICK_DRAFT_CREDIT_COST, "Regenerate this option", () => {
        void runVariantRegen(variantIndex, value);
      });
      return;
    }

    if (kind === "council-text" && councilPostId) {
      requestCreditAction(QUICK_DRAFT_CREDIT_COST, "Regenerate text", () => {
        void (async () => {
          try {
            await applyPostChanges.mutateAsync({
              postId: councilPostId,
              additionalFeedback: value.trim() || undefined,
            });
            trackProductEvent("council_text_regenerated");
            showToast("Text regenerated", "auto_awesome");
            void councilPostQuery.refetch();
          } catch (err) {
            showToast(getApiErrorMessage(err), "error");
            if (isCreditsExhaustedError(err)) router.push("/app/billing");
          }
        })();
      });
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

  const visibleVariants = useMemo(
    () =>
      variants
        .map((variant, index) => ({ variant, index }))
        .filter(({ index }) => !dismissedVariantIndices.includes(index)),
    [dismissedVariantIndices, variants],
  );

  const enterCompareMode = () => {
    setCompareMode(true);
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setAiPick(null);
  };

  const handleSelectForMe = async () => {
    if (visibleVariants.length < 2) {
      showToast("Need at least two options to compare", "error");
      return;
    }
    try {
      const result = await comparePickMutation.mutateAsync({
        variants: visibleVariants.map(({ variant }) => ({
          hook: variant.hook,
          body: variant.body,
          cta: variant.cta,
          tags: variant.tags,
        })),
        contentProfileId: form.contentProfileId || undefined,
        topic: form.topic.trim() || undefined,
      });
      const picked = visibleVariants[result.recommendedIndex];
      if (!picked) {
        showToast("Could not map AI recommendation", "error");
        return;
      }
      setAiPick({
        variantIndex: picked.index,
        reason: result.reason,
      });
      if (!compareMode) setCompareMode(true);
      showToast(`AI recommends Option ${picked.index + 1}`, "auto_awesome");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const compareGridClass =
    visibleVariants.length <= 1
      ? "grid grid-cols-1 gap-4"
      : visibleVariants.length === 2
        ? "grid grid-cols-1 gap-4 md:grid-cols-2"
        : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

  const formPanel = (
    <>
      <div className="mb-[18px] flex gap-2">
        {GEN_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={formDisabled || m.disabled}
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

      <SelectField
        label="Post type"
        fieldClassName="mb-4"
        options={POST_TYPE_SELECT_OPTIONS}
        value={form.postType}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            postType: event.target.value as PostType,
          }))
        }
        disabled={formDisabled}
      />

      <SelectField
        label="Tone"
        fieldClassName="mb-4"
        options={[
          ...TONE_OPTIONS.map((tone) => ({ value: tone, label: tone })),
          { value: "__custom__", label: "Custom tone…" },
        ]}
        value={form.useCustomTone ? "__custom__" : form.tone}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "__custom__") {
            setForm((current) => ({ ...current, useCustomTone: true }));
            return;
          }
          setForm((current) => ({
            ...current,
            tone: value,
            useCustomTone: false,
          }));
        }}
        disabled={formDisabled}
      />

      {form.useCustomTone ? (
        <InputField
          label="Custom tone"
          fieldClassName="mb-4"
          value={form.customTone}
          maxLength={200}
          placeholder="Funny but professional, like a founder telling a story..."
          onChange={(event) =>
            setForm((current) => ({ ...current, customTone: event.target.value }))
          }
          disabled={formDisabled}
        />
      ) : null}

      {mode === "council" ? (
        <div className="mb-4">
          <MediaFormatFields
            values={{
              mediaFormat: form.mediaFormat,
              carouselSlideCount: form.carouselSlideCount,
              carouselStyle: form.carouselStyle,
              mediaTemplateId: form.mediaTemplateId,
            }}
            templateOptions={mediaTemplateOptions}
            disabled={formDisabled}
            onChange={(patch) =>
              setForm((current) => ({ ...current, ...patch }))
            }
          />
        </div>
      ) : null}

      {mode === "council" ? (
        <TextareaField
          label="Custom media prompt"
          hint="(optional)"
          fieldClassName="mb-4"
          className="h-16"
          value={form.mediaCustomPrompt}
          maxLength={5000}
          placeholder="Minimal dark layout, gold accent, professional LinkedIn feed style..."
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              mediaCustomPrompt: event.target.value,
            }))
          }
          disabled={formDisabled}
        />
      ) : null}

      <InputField
        label="Topic"
        fieldClassName="mb-4"
        value={form.topic}
        maxLength={500}
        placeholder="A hard lesson from scaling my team"
        labelAside={
          <TopicMagicButton
            onClick={() => void handleSuggestTopics()}
            loading={topicSuggestionsMutation.isPending}
            disabled={!form.contentProfileId || formDisabled}
            hasSuggestions={topicSuggestions.length > 0}
          />
        }
        onChange={(event) =>
          setForm((current) => ({ ...current, topic: event.target.value }))
        }
        disabled={formDisabled}
      />

      <TopicSuggestionsPicker
        suggestions={topicSuggestions}
        onSelect={handleSelectTopicSuggestion}
        disabled={formDisabled}
        stale={topicsStale}
        onRefresh={() => void handleSuggestTopics()}
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
        labelAside={
          <VoiceMicButton
            disabled={formDisabled}
            value={form.additionalContext}
            onChange={(text) =>
              setForm((current) => ({
                ...current,
                additionalContext: text,
              }))
            }
          />
        }
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
          placeholder="Add extra direction for the council: audience, angle, key points…"
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
        onClick={() =>
          requestCreditAction(
            modeCost,
            `Generate with ${selectedMode.label}`,
            () => {
              void runGenerate();
            },
          )
        }
        disabled={!canSubmitGenerate}
      >
        <MsIcon name="auto_awesome" size={19} />
        {isCouncilRunning
          ? "Council running…"
          : isMediaJobRunning
            ? "Generating image…"
            : generating
              ? "Starting…"
              : `Generate with ${selectedMode.label}`}
      </Button>
    </>
  );

  return (
    <div className={compareMode ? "block" : "pp-gen"}>
      {!compareMode ? (
        <div className="sticky top-[90px] rounded-[18px] border border-[#eceef4] bg-white p-[22px]">
          <div className="mb-[18px] flex items-center gap-2.5">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
              <MsIcon name="auto_awesome" size={21} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold">Post generator</h2>
              <p className="text-[12.5px] text-[#94a3b8]">
                {mode === "council"
                  ? "Run the AI Council for a reviewed post with image."
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
            <GenerationHistoryPanel
              history={history}
              onRestore={handleRestoreHistory}
            />
          </QueryState>
        </div>
      ) : null}

      <div className={compareMode ? "w-full min-w-0" : undefined}>
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
            <div className="flex flex-col gap-4">
              <CouncilTimeline
                events={councilJob.data.events ?? []}
                progress={councilJob.data.progress}
                status={councilJob.data.status}
                errorMessage={councilJob.data.errorMessage}
                postPackageId={councilJob.data.postPackageId}
              />
              {councilPostReady && councilPostQuery.data ? (
                <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white shadow-[0_1px_3px_rgba(24,28,64,0.05)]">
                  <div className="flex items-center justify-between border-b border-[#f1f3f8] bg-[#fbfbfd] px-[18px] py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
                      <MsIcon name="groups" size={13} />
                      COUNCIL POST
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="icon"
                        size="icon"
                        aria-label="Copy post"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          void copyPostToClipboard({
                            hook: councilPostQuery.data.hook,
                            body: councilPostQuery.data.body,
                            cta: councilPostQuery.data.cta,
                            tags: councilPostQuery.data.tags,
                          }).then(() => showToast("Copied", "content_copy"))
                        }
                      >
                        <MsIcon
                          name="content_copy"
                          size={16}
                          className="text-[#475569]"
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="icon"
                        size="icon"
                        href={`/app/posts/${councilPostQuery.data.id}`}
                        aria-label="Open full page"
                        disabled={cardActionsDisabled}
                      >
                        <MsIcon
                          name="open_in_new"
                          size={16}
                          className="text-[#475569]"
                        />
                      </Button>
                    </div>
                  </div>
                  <div className="p-[18px]">
                    {isMediaJobRunning && councilPostId ? (
                      <MediaGeneratingSkeleton label="Generating media…" />
                    ) : (councilPostQuery.data.media ?? []).some((item) => item.url) ? (
                      <PostMediaCarouselViewer
                        items={councilPostQuery.data.media}
                      />
                    ) : null}
                    <p className="mb-3 font-display text-[16.5px] font-bold leading-snug text-[#0f172a]">
                      {councilPostQuery.data.hook}
                    </p>
                    <p className="mb-3.5 whitespace-pre-wrap text-sm leading-relaxed text-[#3f4a5e]">
                      {councilPostQuery.data.body}
                    </p>
                    {councilPostQuery.data.cta ? (
                      <div className="mb-4 rounded-[11px] border-l-[3px] border-[#4f46e5] bg-[#f6f7fb] px-3.5 py-3 text-[13.5px] font-medium text-[#1e293b]">
                        {councilPostQuery.data.cta}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        href={`/app/posts/${councilPostQuery.data.id}`}
                        disabled={cardActionsDisabled}
                      >
                        <MsIcon name="edit" size={16} />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          setPromptModal({
                            kind: "council-text",
                            value: "",
                          })
                        }
                      >
                        <MsIcon name="refresh" size={16} />
                        Regenerate text (1 cr)
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          setGenerateMediaModal({
                            kind: "council",
                            values: buildGenerateMediaModalValues(),
                          })
                        }
                      >
                        <MsIcon name="image" size={16} />
                        Regenerate image (2 cr)
                      </Button>
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          openSchedule({
                            postId: councilPostQuery.data.id,
                            hook: councilPostQuery.data.hook,
                            mode: "schedule",
                          })
                        }
                      >
                        <MsIcon name="event_available" size={16} />
                        Schedule
                      </Button>
                      <Button
                        type="button"
                        variant="linkedin"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          confirmPublishNow({
                            postId: councilPostQuery.data.id,
                            hook: councilPostQuery.data.hook,
                          })
                        }
                      >
                        <MsIcon name="send" size={16} />
                        Post now
                      </Button>
                      <Button
                        type="button"
                        variant="destructive-outline"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() => {
                          void deletePost
                            .mutateAsync(councilPostQuery.data.id)
                            .then(() => {
                              trackProductEvent("council_post_rejected");
                              setActiveCouncilJobId(null);
                              if (activeWorkspaceId) {
                                saveGenerationSession(activeWorkspaceId, {
                                  activeCouncilJobId: null,
                                });
                              }
                              showToast("Council post discarded", "cancel");
                            })
                            .catch((err) =>
                              showToast(getApiErrorMessage(err), "error"),
                            );
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ) : councilMediaGenerating ? (
                <MediaGeneratingSkeleton label="Generating media…" />
              ) : councilPostId && !councilJobComplete ? (
                <div className="rounded-2xl border border-dashed border-[#d8dce8] bg-white px-4 py-8 text-center text-[13px] text-[#64748b]">
                  Finishing council review and media…
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#d8dce8] bg-white px-8 py-14 text-center">
              <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#eef2ff] to-[#ecfeff]">
                <MsIcon name="groups" size={34} className="text-[#4f46e5]" />
              </div>
              <h3 className="mb-2 font-display text-[19px] font-bold">
                AI Council progress will appear here
              </h3>
              <p className="mb-[22px] max-w-[360px] text-[14.5px] leading-relaxed text-[#64748b]">
                Agents write, review, edit, and generate an image, with live
                progress as each step completes.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => void runGenerate()}
                disabled={!canSubmitGenerate}
              >
                <MsIcon name="groups" size={18} />
                {`Run AI Council (${modeCost} credits)`}
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
        ) : generated && variants.length > 0 && visibleVariants.length === 0 ? (
          <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#d8dce8] bg-white px-8 py-14 text-center">
            <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#eef2ff] to-[#ecfeff]">
              <MsIcon name="check_circle" size={34} className="text-[#16a34a]" />
            </div>
            <h3 className="mb-2 font-display text-[19px] font-bold">
              All variants saved
            </h3>
            <p className="mb-[22px] max-w-[340px] text-[14.5px] leading-relaxed text-[#64748b]">
              Every draft from this run has been saved or sent for review. Generate
              again to create new options.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void runGenerate()}
              disabled={!canSubmitGenerate}
            >
              <MsIcon name="auto_awesome" size={18} />
              Regenerate ({QUICK_DRAFT_CREDIT_COST} credit)
            </Button>
          </div>
        ) : generated && visibleVariants.length > 0 ? (
          <div className="flex flex-col gap-4">
            {staleSessionBanner ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[11px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[13px] text-[#92400e]">
                <span>This session is older than 24 hours.</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setStaleSessionBanner(false)}
                  >
                    Keep
                  </Button>
                  <Button
                    type="button"
                    variant="muted"
                    size="xs"
                    onClick={() => {
                      setVariants([]);
                      setOriginalVariants([]);
                      setGenerated(false);
                      setSavedPostIds({});
                      setDismissedVariantIndices([]);
                      setStaleSessionBanner(false);
                      if (activeWorkspaceId) {
                        saveGenerationSession(activeWorkspaceId, {
                          quickDraft: null,
                        });
                      }
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : null}
            {undoDismissIndex != null ? (
              <div className="flex items-center justify-between rounded-[11px] border border-[#e3e6ef] bg-white px-3 py-2 text-[13px]">
                <span>1 option discarded</span>
                <Button type="button" variant="ghost" size="xs" onClick={undoRejectVariant}>
                  Undo
                </Button>
              </div>
            ) : null}
            {compareMode ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#ddd6fe] bg-[#f5f3ff] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={exitCompareMode}
                  >
                    <MsIcon name="arrow_back" size={16} />
                    Exit compare
                  </Button>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4338ca]">
                    <MsIcon name="view_kanban" size={18} />
                    Comparing {visibleVariants.length} options side by side
                  </span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  disabled={
                    cardActionsDisabled ||
                    visibleVariants.length < 2 ||
                    comparePickMutation.isPending
                  }
                  onClick={() => void handleSelectForMe()}
                >
                  <MsIcon
                    name={
                      comparePickMutation.isPending
                        ? "progress_activity"
                        : "auto_awesome"
                    }
                    size={16}
                    className={
                      comparePickMutation.isPending ? "animate-ppspin" : undefined
                    }
                  />
                  {comparePickMutation.isPending
                    ? "Choosing…"
                    : "Select for me"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#16a34a]">
                  <MsIcon name="check_circle" size={19} />
                  {visibleVariants.length} posts ready
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="muted"
                    size="xs"
                    onClick={enterCompareMode}
                    disabled={cardActionsDisabled || visibleVariants.length < 2}
                  >
                    <MsIcon name="view_kanban" size={16} />
                    Compare
                  </Button>
                  <Button
                    type="button"
                    variant="muted"
                    size="xs"
                    disabled={
                      cardActionsDisabled ||
                      visibleVariants.length < 2 ||
                      comparePickMutation.isPending
                    }
                    onClick={() => void handleSelectForMe()}
                  >
                    <MsIcon
                      name={
                        comparePickMutation.isPending
                          ? "progress_activity"
                          : "auto_awesome"
                      }
                      size={16}
                      className={
                        comparePickMutation.isPending
                          ? "animate-ppspin"
                          : undefined
                      }
                    />
                    {comparePickMutation.isPending
                      ? "Choosing…"
                      : "Select for me"}
                  </Button>
                  <Button
                    type="button"
                    variant="muted"
                    size="xs"
                    onClick={() =>
                      requestCreditAction(
                        QUICK_DRAFT_CREDIT_COST,
                        "Regenerate all options",
                        () => {
                          void runGenerate();
                        },
                      )
                    }
                    disabled={!canSubmitGenerate || cardActionsDisabled}
                  >
                    <MsIcon name="refresh" size={16} />
                    Regenerate ({QUICK_DRAFT_CREDIT_COST} credit)
                  </Button>
                </div>
              </div>
            )}
            {aiPick ? (
              <div className="rounded-[11px] border border-[#c7d2fe] bg-[#eef2ff] px-3.5 py-3 text-[13px] leading-relaxed text-[#312e81]">
                <span className="font-semibold">
                  AI recommends Option {aiPick.variantIndex + 1}:{" "}
                </span>
                {aiPick.reason}
              </div>
            ) : null}
            <div
              className={
                compareMode ? compareGridClass : "flex flex-col gap-4"
              }
            >
            {visibleVariants.map(({ variant, index: i }) => {
              const wordCount = countWords(variant.hook, variant.body, variant.cta);
              const isSaving = savingVariantIndex === i;
              const isActing = actionVariantIndex === i;
              const isSendingToReview = reviewVariantIndex === i;
              const isEditing = editingVariantIndex === i;
              const isRegeneratingText = regeneratingVariantIndex === i;
              const mediaPreviewUrl = variantMediaUrls[i];
              const postMediaGenerating = variantPostStatuses[i] === "media_generating";
              const isGeneratingMedia =
                (mediaVariantIndex === i && !mediaPreviewUrl) ||
                (postMediaGenerating && !mediaPreviewUrl);
              const generateMediaDisabledReason = getGenerateMediaDisabledReason(i);
              const generateMediaDisabled =
                cardActionsDisabled ||
                isGeneratingMedia ||
                !!generateMediaDisabledReason;

              const isAiPick = aiPick?.variantIndex === i;

              return (
                <div
                  key={`variant-${i}`}
                  className={`animate-ppscale overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(24,28,64,0.05)] ${
                    isAiPick
                      ? "border-[#4f46e5] ring-2 ring-[#4f46e5]/ring-offset-2"
                      : "border-[#eceef4]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#f1f3f8] bg-[#fbfbfd] px-[18px] py-3">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#4f46e5]">
                        <MsIcon name="auto_awesome" size={13} />
                        AI DRAFT · OPTION {i + 1}
                      </span>
                      {isAiPick ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#4f46e5] px-2 py-1 text-[10.5px] font-bold tracking-wide text-white">
                          <MsIcon name="check_circle" size={13} />
                          AI PICK
                        </span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="mr-1 text-[11.5px] text-[#94a3b8]">
                        {wordCount} words
                      </span>
                      <Button
                        type="button"
                        variant="icon"
                        size="icon"
                        aria-label="Copy post"
                        disabled={cardActionsDisabled}
                        onClick={() => void handleCopyVariant(i)}
                      >
                        <MsIcon
                          name="content_copy"
                          size={16}
                          className="text-[#475569]"
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="icon"
                        size="icon"
                        aria-label={
                          speechPlayback?.variantIndex === i
                            ? speechPlayback.state === "playing"
                              ? "Pause read aloud"
                              : "Resume read aloud"
                            : "Read aloud"
                        }
                        onClick={() => handleToggleSpeak(i)}
                        disabled={cardActionsDisabled}
                      >
                        <MsIcon
                          name={
                            speechPlayback?.variantIndex === i
                              ? speechPlayback.state === "playing"
                                ? "pause"
                                : "play_arrow"
                              : "volume_up"
                          }
                          size={16}
                          className={
                            speechPlayback?.variantIndex === i
                              ? "text-[#4f46e5]"
                              : "text-[#475569]"
                          }
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="icon"
                        size="icon"
                        aria-label="Reject option"
                        disabled={cardActionsDisabled}
                        onClick={() => void rejectVariant(i)}
                      >
                        <MsIcon name="close" size={16} className="text-[#475569]" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-[18px]">
                    {mediaPreviewUrl ? (
                      <PostMediaImage
                        className="mb-4"
                        src={mediaPreviewUrl}
                        alt="Generated media"
                      />
                    ) : isGeneratingMedia ? (
                      <MediaGeneratingSkeleton label="Generating media…" />
                    ) : null}
                    {isRegeneratingText ? (
                      <div className="mb-4 space-y-2.5 py-2">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#4f46e5]">
                          <MsIcon
                            name="progress_activity"
                            size={20}
                            className="animate-ppspin"
                          />
                          Regenerating text…
                        </div>
                        <div className="animate-ppshimmer h-3.5 w-[60%] rounded-md" />
                        <div className="animate-ppshimmer h-2.5 w-full rounded-md" />
                        <div className="animate-ppshimmer h-2.5 w-[95%] rounded-md" />
                        <div className="animate-ppshimmer h-2.5 w-[80%] rounded-md" />
                      </div>
                    ) : (
                    <>
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
                    {isEditing ? (
                      <div className="mb-4 space-y-3">
                        <InputField
                          label="Hook"
                          value={variant.hook}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, index) =>
                                index === i
                                  ? { ...item, hook: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <TextareaField
                          label="Body"
                          className="min-h-28"
                          value={variant.body}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, index) =>
                                index === i
                                  ? { ...item, body: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <InputField
                          label="CTA"
                          value={variant.cta}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, index) =>
                                index === i
                                  ? { ...item, cta: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <InputField
                          label="Tags"
                          value={variant.tags.join(", ")}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((item, index) =>
                                index === i
                                  ? {
                                      ...item,
                                      tags: event.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => void handleSaveVariantEdits(i)}
                          >
                            Done
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleResetVariant(i)}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                    </>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          setEditingVariantIndex(isEditing ? null : i)
                        }
                      >
                        <MsIcon name="edit" size={16} />
                        {isEditing ? "Editing" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() =>
                          setPromptModal({ kind: "regen", variantIndex: i, value: "" })
                        }
                      >
                        <MsIcon name="refresh" size={16} />
                        Regenerate (1 cr)
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() => void handleSaveDraft(i)}
                      >
                        <MsIcon name="bookmark_add" size={16} style={{ color: "#7c3aed" }} />
                        {isSaving ? "Saving…" : "Save Draft"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() => void handleSendToReview(i)}
                      >
                        <MsIcon name="rate_review" size={16} style={{ color: "#0891b2" }} />
                        {isSendingToReview ? "Sending…" : "Send to Review"}
                      </Button>
                      <span
                        className="inline-flex"
                        title={generateMediaDisabledReason ?? undefined}
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={generateMediaDisabled}
                          onClick={() => void handleGenerateMedia(i)}
                        >
                          <MsIcon name="image" size={16} style={{ color: "#c026d3" }} />
                          {isGeneratingMedia
                            ? "Generating…"
                            : mediaPreviewUrl
                              ? `Regenerate Media (${variantMediaCreditCost} cr)`
                              : `Generate Media (${variantMediaCreditCost} cr)`}
                        </Button>
                      </span>
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        disabled={cardActionsDisabled}
                        onClick={() => void handleSchedule(i)}
                      >
                        <MsIcon name="event_available" size={16} />
                        {isActing ? "Preparing…" : "Approve & Schedule"}
                      </Button>
                      <Button
                        type="button"
                        variant="linkedin"
                        size="sm"
                        disabled={cardActionsDisabled}
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

      <CreditConfirmModal
        open={!!creditConfirm}
        cost={creditConfirm?.cost ?? 1}
        actionLabel={creditConfirm?.label ?? "This action"}
        onClose={() => setCreditConfirm(null)}
        onConfirm={(skipFuture) => {
          if (skipFuture && activeWorkspaceId) {
            setSkipCreditConfirm(true);
            saveGenerationSession(activeWorkspaceId, {
              skipCreditConfirm: true,
            });
          }
          const action = creditConfirm?.onConfirm;
          setCreditConfirm(null);
          action?.();
        }}
      />

      <PromptModal
        open={!!promptModal}
        title="What should change?"
        description="Optional. Leave blank to let AI decide."
        confirmLabel="Continue"
        value={promptModal?.value ?? ""}
        onChange={(value) =>
          setPromptModal((current) =>
            current ? { ...current, value } : current,
          )
        }
        onClose={() => setPromptModal(null)}
        onConfirm={() => void confirmPromptModal()}
        isSubmitting={
          quickDraftSingle.isPending || applyPostChanges.isPending
        }
        creditCost={QUICK_DRAFT_CREDIT_COST}
      />

      <GenerateMediaModal
        open={!!generateMediaModal}
        values={generateMediaModal?.values ?? buildGenerateMediaModalValues()}
        templateOptions={mediaTemplateOptions}
        isSubmitting={generatePostMedia.isPending || mediaJobActive}
        onChange={(patch) =>
          setGenerateMediaModal((current) =>
            current
              ? { ...current, values: { ...current.values, ...patch } }
              : current,
          )
        }
        onClose={() => setGenerateMediaModal(null)}
        onConfirm={() => confirmGenerateMediaModal()}
      />
    </div>
  );
}
