import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import clerkConfig from './config/clerk.config';
import councilConfig from './config/council.config';
import openaiConfig from './config/openai.config';
import r2Config from './config/r2.config';
import redisConfig from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentProfilesModule } from './modules/content-profiles/content-profiles.module';
import { CouncilModule } from './modules/council/council.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { CreditsModule } from './modules/credits/credits.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GenerationModule } from './modules/generation/generation.module';
import { JobQueueModule } from './modules/job-queue/job-queue.module';
import { PostsModule } from './modules/posts/posts.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [clerkConfig, r2Config, openaiConfig, redisConfig, councilConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    JobQueueModule.forRoot(),
    AuthModule,
    DocumentsModule,
    WorkspacesModule,
    ContentProfilesModule,
    PostsModule,
    DashboardModule,
    CalendarModule,
    ApprovalsModule,
    CreditsModule,
    GenerationModule,
    CouncilModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
