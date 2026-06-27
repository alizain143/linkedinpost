import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [WorkspacesModule, CreditsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
