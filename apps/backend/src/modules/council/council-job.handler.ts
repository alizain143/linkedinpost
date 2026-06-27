import { Injectable } from '@nestjs/common';
import {
  CreditTransactionType,
  GenerationJobType,
  PostSource,
} from '@prisma/client';
import { CreditsService } from '../credits/credits.service';
import { JobHandler } from '../job-queue/job-handler.interface';
import { CouncilOrchestrator } from './council-orchestrator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouncilJobHandler implements JobHandler {
  readonly type = GenerationJobType.council;

  constructor(
    private readonly prisma: PrismaService,
    private readonly councilOrchestrator: CouncilOrchestrator,
    private readonly creditsService: CreditsService,
  ) {}

  async handle(generationJobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
      include: { councilRun: true },
    });

    if (!job.councilRun) {
      throw new Error(`Council run not found for job ${generationJobId}`);
    }

    await this.councilOrchestrator.run(job.councilRun.id);

    const post = job.postPackageId
      ? await this.prisma.postPackage.findUnique({
          where: { id: job.postPackageId },
        })
      : null;

    const creditType =
      post?.source === PostSource.autopilot
        ? CreditTransactionType.autopilot
        : CreditTransactionType.council;

    await this.creditsService.consume(
      job.userId,
      job.creditCost,
      creditType,
      generationJobId,
    );

    await this.prisma.generationJob.update({
      where: { id: generationJobId },
      data: { creditCharged: true },
    });
  }
}
