import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { CreditsModule } from '../credits/credits.module';
import { GenerationModule } from '../generation/generation.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CalendarJobHandler } from './calendar-job.handler';
import { CalendarJobHandlerRegistrar } from './calendar-job-handler.registrar';
import { CalendarJobService } from './calendar-job.service';
import { CalendarOrchestrator } from './calendar-orchestrator';
import { CalendarPlannerService } from './calendar-planner.service';
import { CalendarSlotService } from './calendar-slot.service';
import { CalendarPlannerOutputParser } from './parsers/calendar-planner-output.parser';

@Module({
  imports: [
    PrismaModule,
    BillingModule,
    WorkspacesModule,
    CreditsModule,
    forwardRef(() => GenerationModule),
  ],
  providers: [
    CalendarJobService,
    CalendarJobHandler,
    CalendarJobHandlerRegistrar,
    CalendarOrchestrator,
    CalendarPlannerService,
    CalendarSlotService,
    CalendarPlannerOutputParser,
  ],
  exports: [CalendarJobService],
})
export class CalendarGenerationModule {}
