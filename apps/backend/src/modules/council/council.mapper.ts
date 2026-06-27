import { CouncilEvent, CouncilRun } from '@prisma/client';

export interface CouncilEventResponse {
  id: string;
  agentRole: string;
  stepOrder: number;
  revisionAttempt: number;
  status: string;
  label: string;
  output: Record<string, unknown> | null;
  scores: Record<string, unknown> | null;
  model: string | null;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
}

export interface CouncilRunResponse {
  id: string;
  generationJobId: string;
  status: string;
  finalScore: number | null;
  revisionCount: number;
  mediaRegenCount: number;
  createdAt: Date;
  completedAt: Date | null;
  events: CouncilEventResponse[];
}

export interface CouncilTimelineResponse {
  postPackageId: string;
  runs: CouncilRunResponse[];
}

export function toCouncilEventResponse(
  event: CouncilEvent,
): CouncilEventResponse {
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

export function toCouncilRunResponse(
  run: CouncilRun & { events: CouncilEvent[] },
): CouncilRunResponse {
  return {
    id: run.id,
    generationJobId: run.generationJobId,
    status: run.status,
    finalScore: run.finalScore,
    revisionCount: run.revisionCount,
    mediaRegenCount: run.mediaRegenCount,
    createdAt: run.createdAt,
    completedAt: run.completedAt,
    events: run.events.map(toCouncilEventResponse),
  };
}

export function toCouncilTimelineResponse(
  postPackageId: string,
  runs: Array<CouncilRun & { events: CouncilEvent[] }>,
): CouncilTimelineResponse {
  return {
    postPackageId,
    runs: runs.map(toCouncilRunResponse),
  };
}
