import type { ContentGoal } from "@/lib/api/types/enums";

export type ApiContentPillar = {
  id: string;
  name: string;
  sortOrder: number;
};

export type ApiContentProfile = {
  id: string;
  workspaceId: string;
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
  isDefault: boolean;
  pillars: ApiContentPillar[];
  createdAt: string;
  updatedAt: string;
};

export type CreateContentProfileBody = {
  name: string;
  roleTitle?: string;
  industry?: string;
  targetAudience?: string;
  contentGoal?: ContentGoal;
  preferredTone?: string;
  brandPrimary?: string;
  brandAccent?: string;
  offerDescription?: string;
  writingSample?: string;
  avoidWords?: string;
  isDefault?: boolean;
  pillars?: string[];
};

export type UpdateContentProfileBody = Partial<CreateContentProfileBody>;

export type DeleteContentProfileResponse = {
  deleted: boolean;
};

export type SuggestContentProfilesBody = {
  roleTitle?: string;
  industry?: string;
  targetAudience?: string;
  contentGoal?: ContentGoal;
  offerDescription?: string;
  notes?: string;
};

export type SuggestedContentProfile = CreateContentProfileBody;

export type ContentProfileSuggestionsResult = {
  profiles: SuggestedContentProfile[];
  promptId: string;
  promptVersion: string;
  model: string;
};

export type ApproveContentProfileSuggestionsBody = {
  profiles: CreateContentProfileBody[];
};
