import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AuthModule, WorkspacesModule, CreditsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
