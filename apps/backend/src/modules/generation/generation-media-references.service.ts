import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenerationJobType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  CouncilInput,
  CouncilPausedState,
  MediaReferenceCandidate,
} from '../generation/generation.types';
import { SubmitMediaReferencesDto } from './dto/submit-media-references.dto';

@Injectable()
export class GenerationMediaReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly enqueueService: GenerationJobEnqueueService,
  ) {}

  async getMediaReferences(
    workspaceId: string,
    userId: string,
    jobId: string,
  ): Promise<MediaReferenceCandidate[]> {
    await this.workspacesService.assertMember(userId, workspaceId);
    const job = await this.findCouncilJob(jobId, workspaceId, userId);
    const paused = job.result as unknown as CouncilPausedState | null;

    if (!paused?.paused || paused.pauseReason !== 'awaiting_media_selection') {
      return paused?.mediaReferences ?? [];
    }

    return paused.mediaReferences;
  }

  async submitMediaReferences(
    workspaceId: string,
    userId: string,
    jobId: string,
    dto: SubmitMediaReferencesDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const job = await this.findCouncilJob(jobId, workspaceId, userId);
    const paused = job.result as unknown as CouncilPausedState | null;

    if (!paused?.paused || paused.pauseReason !== 'awaiting_media_selection') {
      throw new BadRequestException({
        error: 'Job is not awaiting media reference selection',
        code: 'JOB_NOT_AWAITING_MEDIA',
      });
    }

    const input = job.input as unknown as CouncilInput;
    const updatedInput: CouncilInput = {
      ...input,
      resumeFrom: 'media_creator',
      selectedReferenceUrls: dto.selectedUrls,
      mediaType: dto.mediaType ?? input.mediaType,
      mediaCustomPrompt: dto.mediaCustomPrompt ?? input.mediaCustomPrompt,
      mediaTemplateId: dto.mediaTemplateId ?? input.mediaTemplateId,
      skipImageScout: true,
    };

    if (job.postPackageId) {
      await this.prisma.postPackage.update({
        where: { id: job.postPackageId },
        data: {
          mediaTypePreference: dto.mediaType ?? undefined,
          mediaCustomPrompt: dto.mediaCustomPrompt ?? undefined,
          mediaTemplateId: dto.mediaTemplateId ?? undefined,
        },
      });
    }

    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: {
        input: updatedInput as unknown as object,
        result: Prisma.JsonNull,
      },
    });

    await this.enqueueService.resumeJob(jobId);
    return { accepted: true };
  }

  private async findCouncilJob(
    jobId: string,
    workspaceId: string,
    userId: string,
  ) {
    const job = await this.prisma.generationJob.findFirst({
      where: {
        id: jobId,
        workspaceId,
        userId,
        type: GenerationJobType.council,
        deletedAt: null,
      },
    });

    if (!job) {
      throw new NotFoundException({
        error: 'Generation job not found',
        code: 'GENERATION_JOB_NOT_FOUND',
      });
    }

    return job;
  }
}
