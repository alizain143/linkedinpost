import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import schedulingConfig from '../../config/scheduling.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { LinkedInModule } from '../linkedin/linkedin.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SchedulingController } from './scheduling.controller';
import { SchedulingPostController } from './scheduling-post.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [
    ConfigModule.forFeature(schedulingConfig),
    PrismaModule,
    WorkspacesModule,
    LinkedInModule,
  ],
  controllers: [SchedulingController, SchedulingPostController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
