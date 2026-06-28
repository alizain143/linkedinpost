import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { CouncilModule } from '../council/council.module';
import { CreditsModule } from '../credits/credits.module';
import { LinkedInModule } from '../linkedin/linkedin.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AutopilotController } from './autopilot.controller';
import { AutopilotDispatchService } from './autopilot-dispatch.service';
import { AutopilotService } from './autopilot.service';
import { AutopilotTickJob } from './autopilot-tick.job';
import { AutopilotTickService } from './autopilot-tick.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BillingModule,
    WorkspacesModule,
    CreditsModule,
    CouncilModule,
    LinkedInModule,
  ],
  controllers: [AutopilotController],
  providers: [
    AutopilotService,
    AutopilotDispatchService,
    AutopilotTickService,
    AutopilotTickJob,
  ],
  exports: [AutopilotService, AutopilotTickService],
})
export class AutopilotModule {}
