import { ContentGoal, PostType, UserPlan } from '@prisma/client';

export interface QuickDraftInput {
  workspaceId: string;
  userId: string;
  topic?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  contentProfileId?: string;
  additionalContext?: string;
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
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TextCompletionRequest {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface TextCompletionResponse {
  content: string;
}
