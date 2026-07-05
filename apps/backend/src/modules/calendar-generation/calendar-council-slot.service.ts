import { Injectable, Logger } from '@nestjs/common';
import {
  GenerationJobStatus,
  GenerationJobType,
  PostPackageStatus,
  PostSource,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CouncilOrchestrator } from '../council/council-orchestrator';
import { CouncilInput } from '../generation/generation.types';
import { CalendarPlannerOutput } from './parsers/calendar-planner-output.parser';

@Injectable()
export class CalendarCouncilSlotService {
  private readonly logger = new Logger(CalendarCouncilSlotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly councilOrchestrator: CouncilOrchestrator,
  ) {}

  async generateSlot(params: {
    workspaceId: string;
    userId: string;
    contentProfileId?: string;
    additionalContext?: string;
    slot: CalendarPlannerOutput['slots'][number];
    scheduledAt: Date;
  }): Promise<{ postPackageId: string; hook: string; pillar: string | null }> {
    const councilInput: CouncilInput = {
      workspaceId: params.workspaceId,
      userId: params.userId,
      topic: params.slot.topic,
      postType: params.slot.postType,
      tone: params.slot.tone,
      pillar: params.slot.pillar,
      contentProfileId: params.contentProfileId,
      additionalContext: params.additionalContext,
    };

    const post = await this.prisma.postPackage.create({
      data: {
        workspaceId: params.workspaceId,
        contentProfileId: params.contentProfileId ?? null,
        hook: params.slot.topic.trim() || 'Generating…',
        topic: params.slot.topic,
        postType: params.slot.postType,
        tone: params.slot.tone,
        pillar: params.slot.pillar,
        source: PostSource.calendar,
        status: PostPackageStatus.text_generating,
        scheduledAt: params.scheduledAt,
      },
    });

    const councilJob = await this.prisma.generationJob.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        type: GenerationJobType.council,
        flowId: 'council',
        promptVersion: 'v1',
        creditCost: 0,
        creditCharged: true,
        status: GenerationJobStatus.running,
        input: councilInput as unknown as Prisma.InputJsonValue,
        postPackageId: post.id,
      },
    });

    try {
      await this.councilOrchestrator.run(councilJob.id);

      const finalized = await this.prisma.postPackage.findUniqueOrThrow({
        where: { id: post.id },
      });

      await this.prisma.postPackage.update({
        where: { id: post.id },
        data: {
          submittedForApprovalAt: new Date(),
          postType: finalized.postType ?? params.slot.postType,
          tone: finalized.tone || params.slot.tone,
          pillar: finalized.pillar || params.slot.pillar,
        },
      });

      return {
        postPackageId: post.id,
        hook: finalized.hook,
        pillar: finalized.pillar ?? params.slot.pillar ?? null,
      };
    } catch (err) {
      this.logger.error(
        `Calendar council slot failed for post ${post.id}`,
        err,
      );
      throw err;
    }
  }
}
