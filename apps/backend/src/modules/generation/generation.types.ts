import {
  ContentGoal,
  CouncilAgentRole,
  PostType,
  UserPlan,
} from '@prisma/client';

export interface PreviousVariantInput {
  hook: string;
  body: string;
  cta: string;
  tags: string[];
}

export interface QuickDraftInput {
  workspaceId: string;
  userId: string;
  topic?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  contentProfileId?: string;
  additionalContext?: string;
  mediaCustomPrompt?: string;
  mediaMode?: 'freestyle' | 'template';
  mediaTemplateId?: string;
  revisionPrompt?: string;
  previousVariant?: PreviousVariantInput;
  approvalFeedback?: string;
}

export interface TopicSuggestionsInput {
  workspaceId: string;
  userId: string;
  contentProfileId?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  additionalContext?: string;
}

export interface CouncilInput extends QuickDraftInput {
  brief?: string;
}

export interface CalendarInput {
  workspaceId: string;
  userId: string;
  durationDays: 7 | 30;
  contentProfileId?: string;
  startDate?: string;
  postingTime: string;
  postingDays: number[];
  additionalContext?: string;
  slotDates: string[];
}

export interface CouncilPriorStep {
  agentRole: CouncilAgentRole;
  revisionAttempt: number;
  output: Record<string, unknown>;
  scores?: Record<string, number>;
}

export interface GenerationUserContext {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string;
  plan: UserPlan;
}

export interface GenerationContentProfileContext {
  id: string;
  name: string;
  roleTitle: string | null;
  industry: string | null;
  targetAudience: string | null;
  contentGoal: ContentGoal;
  preferredTone: string | null;
  brandPrimary: string | null;
  brandAccent: string | null;
  offerDescription: string | null;
  writingSample: string | null;
  avoidWords: string | null;
  pillars: string[];
}

export interface GenerationInputContext {
  topic?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  additionalContext?: string;
  brief?: string;
  mediaCustomPrompt?: string;
  revisionPrompt?: string;
  approvalFeedback?: string;
  previousHook?: string;
  previousBody?: string;
  previousCta?: string;
  previousTags?: string[];
  calendarSlotDates?: string[];
  calendarSlotCount?: number;
  calendarDurationDays?: number;
}

export interface QuickDraftSingleResult {
  variant: QuickDraftVariant;
  promptId: string;
  promptVersion: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ReviseDraftResult {
  variant: QuickDraftVariant;
  postPackageId: string;
  promptId: string;
  promptVersion: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface GenerationDocumentContext {
  id: string;
  filename: string;
  mimeType: string;
}

export interface GenerationContext {
  workspaceId: string;
  userId: string;
  contentProfileId?: string;
  user?: GenerationUserContext;
  contentProfile?: GenerationContentProfileContext;
  input?: GenerationInputContext;
  documents?: GenerationDocumentContext[];
  priorSteps?: CouncilPriorStep[];
  /** When set, priorSteps are projected for this council agent before render. */
  promptAgentRole?: CouncilAgentRole;
  /** Reviewer pass threshold injected from orchestrator config. */
  councilPassScore?: number;
}

export interface GenerationJobProgress {
  currentStep: string;
  currentLabel: string;
  completedSteps: number;
  totalSteps: number;
  percentComplete: number;
}

export interface CouncilJobResult {
  postPackageId: string;
  finalScore: number | null;
  revisionCount: number;
  mediaRegenCount: number;
}

export interface CalendarJobResultSlot {
  postPackageId: string;
  scheduledAt: string;
  topic: string;
  pillar: string | null;
}

export interface CalendarJobResult {
  durationDays: 7 | 30;
  slotCount: number;
  postPackageIds: string[];
  slots: CalendarJobResultSlot[];
}

export type GenerationContextSlice = Partial<GenerationContext>;

export interface QuickDraftVariant {
  hook: string;
  body: string;
  cta: string;
  tags: string[];
  postType: PostType;
  tone: string;
  pillar: string;
}

export interface QuickDraftResult {
  variants: QuickDraftVariant[];
  promptId: string;
  promptVersion: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface TopicSuggestion {
  topic: string;
  pillar?: string;
  rationale?: string;
}

export interface TopicSuggestionsResult {
  suggestions: TopicSuggestion[];
  promptId: string;
  promptVersion: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ComparePickInput {
  workspaceId: string;
  userId: string;
  contentProfileId?: string;
  topic?: string;
  variants: QuickDraftVariant[];
}

export interface ComparePickResult {
  recommendedIndex: number;
  reason: string;
  promptId: string;
  promptVersion: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TextCompletionRequest {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json';
}

export interface TextCompletionResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
