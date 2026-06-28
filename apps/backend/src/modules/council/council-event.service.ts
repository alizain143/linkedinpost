import { Injectable } from '@nestjs/common';
import {
  CouncilAgentRole,
  CouncilEventStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerationJobProgress } from '../generation/generation.types';
import { computeCouncilProgress } from './council-progress';

@Injectable()
export class CouncilEventService {
  constructor(private readonly prisma: PrismaService) {}

  async startEvent(params: {
    generationJobId: string;
    agentRole: CouncilAgentRole;
    stepOrder: number;
    revisionAttempt: number;
    label: string;
    completedSteps: number;
    totalSteps: number;
  }) {
    const event = await this.prisma.councilEvent.create({
      data: {
        generationJobId: params.generationJobId,
        agentRole: params.agentRole,
        stepOrder: params.stepOrder,
        revisionAttempt: params.revisionAttempt,
        status: CouncilEventStatus.running,
        label: params.label,
      },
    });

    await this.updateJobProgress(
      params.generationJobId,
      params.agentRole,
      params.label,
      params.completedSteps,
      params.totalSteps,
    );

    return event;
  }

  async completeEvent(
    eventId: string,
    params: {
      generationJobId: string;
      agentRole: CouncilAgentRole;
      label: string;
      completedSteps: number;
      totalSteps: number;
      output?: Record<string, unknown>;
      scores?: Record<string, number>;
      model?: string;
      inputTokens?: number;
      outputTokens?: number;
      startedAt: Date;
    },
  ) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - params.startedAt.getTime();

    await this.prisma.councilEvent.update({
      where: { id: eventId },
      data: {
        status: CouncilEventStatus.completed,
        label: params.label,
        output: params.output as Prisma.InputJsonValue,
        scores: params.scores as Prisma.InputJsonValue,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        completedAt,
        durationMs,
      },
    });

    await this.updateJobProgress(
      params.generationJobId,
      params.agentRole,
      params.label,
      params.completedSteps,
      params.totalSteps,
    );
  }

  async failEvent(
    eventId: string,
    params: {
      errorCode: string;
      errorMessage: string;
    },
  ) {
    await this.prisma.councilEvent.update({
      where: { id: eventId },
      data: {
        status: CouncilEventStatus.failed,
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        completedAt: new Date(),
      },
    });
  }

  private async updateJobProgress(
    generationJobId: string,
    currentStep: string,
    currentLabel: string,
    completedSteps: number,
    totalSteps: number,
  ) {
    const progress: GenerationJobProgress = computeCouncilProgress(
      completedSteps,
      currentStep,
      currentLabel,
      totalSteps,
    );

    await this.prisma.generationJob.update({
      where: { id: generationJobId },
      data: {
        currentStep,
        progress: progress as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
