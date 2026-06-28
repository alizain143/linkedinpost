import { Injectable } from '@nestjs/common';
import { CreditTransactionType, GenerationJobType } from '@prisma/client';
import { CreditsService } from '../credits/credits.service';
import { JobHandler } from '../job-queue/job-handler.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarOrchestrator } from './calendar-orchestrator';

@Injectable()
export class CalendarJobHandler implements JobHandler {
  readonly type = GenerationJobType.calendar;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarOrchestrator: CalendarOrchestrator,
    private readonly creditsService: CreditsService,
  ) {}

  async handle(generationJobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
    });

    await this.calendarOrchestrator.run(generationJobId);

    await this.creditsService.consume(
      job.userId,
      job.creditCost,
      CreditTransactionType.calendar,
      { generationJobId },
    );

    await this.prisma.generationJob.update({
      where: { id: generationJobId },
      data: { creditCharged: true },
    });
  }
}
