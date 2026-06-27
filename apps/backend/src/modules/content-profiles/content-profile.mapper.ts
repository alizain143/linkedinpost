import { ContentGoal, ContentProfile, ContentPillar } from '@prisma/client';

export interface ContentPillarResponse {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ContentProfileResponse {
  id: string;
  workspaceId: string;
  name: string;
  roleTitle: string | null;
  industry: string | null;
  targetAudience: string | null;
  contentGoal: ContentGoal;
  preferredTone: string | null;
  offerDescription: string | null;
  writingSample: string | null;
  avoidWords: string | null;
  isDefault: boolean;
  pillars: ContentPillarResponse[];
  createdAt: Date;
  updatedAt: Date;
}

type ContentProfileWithPillars = ContentProfile & { pillars: ContentPillar[] };

export function toContentProfileResponse(
  profile: ContentProfileWithPillars,
): ContentProfileResponse {
  return {
    id: profile.id,
    workspaceId: profile.workspaceId,
    name: profile.name,
    roleTitle: profile.roleTitle,
    industry: profile.industry,
    targetAudience: profile.targetAudience,
    contentGoal: profile.contentGoal,
    preferredTone: profile.preferredTone,
    offerDescription: profile.offerDescription,
    writingSample: profile.writingSample,
    avoidWords: profile.avoidWords,
    isDefault: profile.isDefault,
    pillars: profile.pillars
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((pillar) => ({
        id: pillar.id,
        name: pillar.name,
        sortOrder: pillar.sortOrder,
      })),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
