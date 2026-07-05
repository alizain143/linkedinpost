import { Injectable } from '@nestjs/common';
import {
  CreditTransactionType,
  GenerationJobStatus,
  GenerationJobType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { QuickDraftSingleRequestDto } from './dto/quick-draft-single-request.dto';
import { QuickDraftSingleGenerator } from './flows/quick-draft-single.generator';
import { extractGenerationError } from './generation.errors';
import { toGenerationJobResponse } from './generation-job.mapper';
import { QuickDraftInput } from './generation.types';

@Injectable()
export class QuickDraftSingleJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly quickDraftSingleGenerator: QuickDraftSingleGenerator,
    private readonly creditsService: CreditsService,
  ) {}

  async runQuickDraftSingle(
    workspaceId: string,
    userId: string,
    dto: QuickDraftSingleRequestDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const input: QuickDraftInput = {
      workspaceId,
      userId,
      topic: dto.topic,
      postType: dto.postType,
      tone: dto.tone,
      pillar: dto.pillar,
      contentProfileId: dto.contentProfileId,
      additionalContext: dto.additionalContext,
      revisionPrompt: dto.revisionPrompt,
      previousVariant: dto.previousVariant,
      avoidVariants: dto.avoidVariants,
    };

    const job = await this.prisma.generationJob.create({
      data: {
        workspaceId,
        userId,
        type: GenerationJobType.quick_draft_single,
        status: GenerationJobStatus.pending,
        flowId: 'quick-draft-single',
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
      const result = await this.quickDraftSingleGenerator.generate(input);

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
            variant: result.variant,
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
}
