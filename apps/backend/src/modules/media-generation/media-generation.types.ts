import { CouncilAgentRole, PostMediaType } from '@prisma/client';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { PostPackage } from '@prisma/client';

export interface MediaJobInput {
  workspaceId: string;
  userId: string;
  postPackageId: string;
  topic?: string;
  postType?: PostPackage['postType'];
  tone?: string | null;
  pillar?: string | null;
  contentProfileId?: string | null;
}

export function toCouncilInputFromPost(
  post: PostPackage,
  userId: string,
): CouncilInput {
  return {
    workspaceId: post.workspaceId,
    userId,
    topic: post.topic ?? post.hook,
    postType: post.postType ?? undefined,
    tone: post.tone ?? undefined,
    pillar: post.pillar ?? undefined,
    contentProfileId: post.contentProfileId ?? undefined,
  };
}

export function buildMediaPriorStepsFromPost(post: PostPackage): CouncilPriorStep[] {
  const copy = {
    hook: post.hook,
    body: post.body ?? '',
    cta: post.cta ?? '',
    tags: post.tags,
  };

  return [
    {
      agentRole: CouncilAgentRole.writer,
      revisionAttempt: 1,
      output: copy,
    },
    {
      agentRole: CouncilAgentRole.editor,
      revisionAttempt: 1,
      output: copy,
    },
  ];
}

export const MEDIA_JOB_TOTAL_STEPS = 2;

export type MediaJobResult = {
  postPackageId: string;
  postMediaId: string;
  mediaType: PostMediaType;
};
