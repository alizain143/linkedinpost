import type {
  GenerationJobStatus,
  GenerationJobType,
  PostType,
} from "@/lib/api/types/enums";

export type TopicSuggestion = {
  topic: string;
  pillar?: string;
  rationale?: string;
};

export type TopicSuggestionsRequestBody = {
  contentProfileId?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  additionalContext?: string;
};

export type TopicSuggestionsResult = {
  suggestions: TopicSuggestion[];
  promptId: string;
  promptVersion: string;
  model: string;
};

export type ComparePickVariantBody = {
  hook: string;
  body: string;
  cta: string;
  tags?: string[];
};

export type ComparePickRequestBody = {
  variants: ComparePickVariantBody[];
  contentProfileId?: string;
  topic?: string;
};

export type ComparePickResult = {
  recommendedIndex: number;
  reason: string;
  promptId: string;
  promptVersion: string;
  model: string;
};

export type QuickDraftVariant = {
  hook: string;
  body: string;
  cta: string;
  tags: string[];
  postType: PostType;
  tone: string;
  pillar: string;
};

export type QuickDraftJobResult = {
  variants: QuickDraftVariant[];
};

export type QuickDraftSingleJobResult = {
  variant: QuickDraftVariant;
  postPackageId?: string;
};

export type QuickDraftRequestBody = {
  topic: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  contentProfileId?: string;
  additionalContext?: string;
  mediaCustomPrompt?: string;
  mediaMode?: "freestyle" | "template";
  mediaTemplateId?: string;
};

export type QuickDraftSingleRequestBody = QuickDraftRequestBody & {
  revisionPrompt?: string;
  previousVariant?: {
    hook: string;
    body: string;
    cta: string;
    tags: string[];
  };
};

export type ApplyChangesRequestBody = {
  additionalFeedback?: string;
};

export type GenerateMediaRequestBody = {
  mediaCustomPrompt?: string;
  replace?: boolean;
  mediaMode?: "freestyle" | "template";
  mediaTemplateId?: string;
};

export type GenerationJobProgress = {
  currentStep: string;
  currentLabel: string;
  completedSteps: number;
  totalSteps: number;
  percentComplete: number;
};

export type CouncilEvent = {
  id: string;
  agentRole: string;
  stepOrder: number;
  revisionAttempt: number;
  status: string;
  label: string;
  output: Record<string, unknown> | null;
  scores: Record<string, unknown> | null;
  model: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
};

export type CouncilJobResult = {
  postPackageId: string;
  finalScore: number | null;
  revisionCount: number;
  mediaRegenCount: number;
};

export type CouncilRequestBody = QuickDraftRequestBody & {
  brief?: string;
};

export type CalendarJobResultSlot = {
  postPackageId: string;
  scheduledAt: string;
  topic: string;
  pillar: string | null;
};

export type CalendarJobResult = {
  durationDays: 7 | 30;
  slotCount: number;
  postPackageIds: string[];
  slots: CalendarJobResultSlot[];
};

export type CalendarGenerateRequestBody = {
  durationDays: 7 | 30;
  contentProfileId?: string;
  startDate?: string;
  postingTime?: string;
  postingDays?: number[];
  additionalContext?: string;
};

export type MediaJobResult = {
  postPackageId: string;
  postMediaId: string;
  mediaType: string;
};

export type ApiGenerationJob = {
  id: string;
  workspaceId: string;
  type: GenerationJobType;
  status: GenerationJobStatus;
  flowId: string;
  promptVersion: string;
  model: string | null;
  creditCost: number;
  creditCharged: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  postPackageId: string | null;
  progress: GenerationJobProgress | null;
  events: CouncilEvent[] | null;
  result:
    | QuickDraftJobResult
    | QuickDraftSingleJobResult
    | CouncilJobResult
    | CalendarJobResult
    | MediaJobResult
    | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
