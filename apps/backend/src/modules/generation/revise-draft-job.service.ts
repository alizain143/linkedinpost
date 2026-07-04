import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreditTransactionType,
  GenerationJobStatus,
  GenerationJobType,
  PostPackageStatus,
  PostType,
  Prisma,
} from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { buildVersionSnapshot } from '../posts/post.mapper';
import { ApplyChangesRequestDto } from './dto/apply-changes-request.dto';
import { ReviseDraftGenerator } from './flows/revise-draft.generator';
import { extractGenerationError } from './generation.errors';
import { toGenerationJobResponse } from './generation-job.mapper';
import { QuickDraftInput } from './generation.types';

const REVISABLE_STATUSES: PostPackageStatus[] = [
  PostPackageStatus.draft,
  PostPackageStatus.ready_for_approval,
];

@Injectable()
export class ReviseDraftJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly reviseDraftGenerator: ReviseDraftGenerator,
    private readonly creditsService: CreditsService,
  ) {}

  async applyChanges(
    workspaceId: string,
    userId: string,
    postId: string,
    dto: ApplyChangesRequestDto = {},
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const post = await this.prisma.postPackage.findFirst({
      where: { id: postId, workspaceId, ...NOT_DELETED },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    if (!REVISABLE_STATUSES.includes(post.status)) {
      throw new ConflictException({
        error: 'Post cannot be revised in its current status',
        code: 'INVALID_POST_STATUS',
      });
    }

    const activeJob = await this.prisma.generationJob.findFirst({
      where: {
        postPackageId: postId,
        type: GenerationJobType.revise_draft,
        status: { in: ['pending', 'running'] },
      },
    });

    if (activeJob) {
      throw new ConflictException({
        error: 'Revision already in progress',
        code: 'REVISE_JOB_IN_PROGRESS',
      });
    }

    const revisionPrompt =
      dto.additionalFeedback?.trim() ||
      post.approvalFeedback?.trim() ||
      'Regenerate this post while keeping the same topic and voice.';

    await this.creditsService.assertHasCredits(userId, 1);

    const previousStatus = post.status;
    const input: QuickDraftInput = {
      workspaceId,
      userId,
      topic: post.topic ?? post.hook,
      postType: post.postType ?? undefined,
      tone: post.tone ?? undefined,
      pillar: post.pillar ?? undefined,
      contentProfileId: post.contentProfileId ?? undefined,
      approvalFeedback: post.approvalFeedback ?? undefined,
      revisionPrompt: revisionPrompt,
      previousVariant: {
        hook: post.hook,
        body: post.body ?? '',
        cta: post.cta ?? '',
        tags: post.tags,
      },
    };

    const job = await this.prisma.generationJob.create({
      data: {
        workspaceId,
        userId,
        postPackageId: postId,
        type: GenerationJobType.revise_draft,
        status: GenerationJobStatus.pending,
        flowId: 'revise-draft',
        promptVersion: 'v1',
        creditCost: 1,
        input: input as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.generationJob.update({
      where: { id: job.id },
      data: { status: GenerationJobStatus.running },
    });

    try {
      const result = await this.reviseDraftGenerator.generate(input);
      const variant = result.variant;

      await this.prisma.$transaction(async (tx) => {
        const latest = await tx.postVersion.findFirst({
          where: { postPackageId: postId },
          orderBy: { versionNumber: 'desc' },
        });
        const nextVersion = (latest?.versionNumber ?? 0) + 1;

        await tx.postVersion.create({
          data: {
            postPackageId: postId,
            versionNumber: nextVersion,
            ...buildVersionSnapshot({
              hook: post.hook,
              body: post.body,
              cta: post.cta,
              tags: post.tags,
            }),
          },
        });

        await tx.postPackage.update({
          where: { id: postId },
          data: {
            hook: variant.hook,
            body: variant.body,
            cta: variant.cta,
            tags: variant.tags,
            postType: variant.postType as PostType,
            tone: variant.tone,
            pillar: variant.pillar,
            approvalFeedback: null,
            status: previousStatus,
          },
        });
      });

      await this.creditsService.consume(
        userId,
        job.creditCost,
        CreditTransactionType.generation,
        { generationJobId: job.id },
      );

      const completed = await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationJobStatus.completed,
          model: result.model,
          result: {
            variant,
            postPackageId: postId,
          } as unknown as Prisma.InputJsonValue,
          inputTokens: result.usage?.inputTokens ?? null,
          outputTokens: result.usage?.outputTokens ?? null,
          creditCharged: true,
          completedAt: new Date(),
        },
      });

      return toGenerationJobResponse(completed);
    } catch (err) {
      const { code, message } = extractGenerationError(err);

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationJobStatus.failed,
          errorCode: code,
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }

  /**
   * Best-effort auto-apply after request-changes. Never throws to the caller.
   * Returns the job response on success, or null when skipped/failed.
   */
  async tryAutoApplyChanges(
    workspaceId: string,
    userId: string,
    postId: string,
  ): Promise<ReturnType<typeof toGenerationJobResponse> | null> {
    try {
      const workspace = await this.prisma.workspace.findFirst({
        where: { id: workspaceId, ...NOT_DELETED },
      });
      if (!workspace || workspace.changesApplyMode !== 'auto_apply') {
        return null;
      }

      return await this.applyChanges(workspaceId, userId, postId, {});
    } catch {
      return null;
    }
  }
}
