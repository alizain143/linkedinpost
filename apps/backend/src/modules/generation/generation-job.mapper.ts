import { GenerationJob, GenerationJobType } from '@prisma/client';
import { GenerationJobResponseDto } from '../../common/swagger/responses/generation-job-response.dto';
import {
  CouncilEventDto,
  CouncilJobResultDto,
  QuickDraftJobResultDto,
} from '../../common/swagger/responses/generation-job-response.dto';
import { GenerationJobProgress, QuickDraftVariant } from './generation.types';

type CouncilEventRecord = {
  id: string;
  agentRole: string;
  stepOrder: number;
  revisionAttempt: number;
  status: string;
  label: string;
  output: unknown;
  scores: unknown;
  model: string | null;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
};

type JobWithCouncil = GenerationJob & {
  councilRun?: {
    id: string;
    events: CouncilEventRecord[];
  } | null;
};

function mapCouncilEvent(event: CouncilEventRecord): CouncilEventDto {
  return {
    id: event.id,
    agentRole: event.agentRole,
    stepOrder: event.stepOrder,
    revisionAttempt: event.revisionAttempt,
    status: event.status,
    label: event.label,
    output: event.output as Record<string, unknown> | null,
    scores: event.scores as Record<string, unknown> | null,
    model: event.model,
    startedAt: event.startedAt,
    completedAt: event.completedAt,
    durationMs: event.durationMs,
  };
}

export function toGenerationJobResponse(
  job: JobWithCouncil,
): GenerationJobResponseDto {
  const progress = job.progress as GenerationJobProgress | null;

  let result: QuickDraftJobResultDto | CouncilJobResultDto | null = null;

  if (job.type === GenerationJobType.quick_draft && job.result) {
    result = {
      variants: (
        job.result as unknown as { variants: QuickDraftVariant[] }
      ).variants,
    };
  }

  if (job.type === GenerationJobType.council && job.result) {
    result = job.result as unknown as CouncilJobResultDto;
  }

  return {
    id: job.id,
    workspaceId: job.workspaceId,
    type: job.type,
    status: job.status,
    flowId: job.flowId,
    promptVersion: job.promptVersion,
    model: job.model,
    creditCost: job.creditCost,
    creditCharged: job.creditCharged,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    postPackageId: job.postPackageId,
    councilRunId: job.councilRun?.id ?? null,
    progress: progress ?? null,
    result,
    events: job.councilRun?.events
      ? job.councilRun.events.map(mapCouncilEvent)
      : null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
  };
}
