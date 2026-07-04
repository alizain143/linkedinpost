import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import googleConfig from './config/google.config';
import appConfig from './config/app.config';
import xpayConfig from './config/xpay.config';
import clerkConfig from './config/clerk.config';
import councilConfig from './config/council.config';
import openaiConfig from './config/openai.config';
import r2Config from './config/r2.config';
import linkedinConfig from './config/linkedin.config';
import mediaConfig from './config/media.config';
import resendConfig from './config/resend.config';
import firebaseConfig from './config/firebase.config';
import schedulingConfig from './config/scheduling.config';
import redisConfig from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentProfilesModule } from './modules/content-profiles/content-profiles.module';
import { CalendarGenerationModule } from './modules/calendar-generation/calendar-generation.module';
import { AutopilotModule } from './modules/autopilot/autopilot.module';
import { BillingModule } from './modules/billing/billing.module';
import { CouncilModule } from './modules/council/council.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { CreditsModule } from './modules/credits/credits.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GenerationModule } from './modules/generation/generation.module';
import { JobQueueModule } from './modules/job-queue/job-queue.module';
import { PostsModule } from './modules/posts/posts.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { LinkedInModule } from './modules/linkedin/linkedin.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ApprovalShareModule } from './modules/approval-share/approval-share.module';
import { MediaGenerationModule } from './modules/media-generation/media-generation.module';
import { MediaTemplatesModule } from './modules/media-templates/media-templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        clerkConfig,
        r2Config,
        openaiConfig,
        googleConfig,
        appConfig,
        xpayConfig,
        redisConfig,
        councilConfig,
        schedulingConfig,
        linkedinConfig,
        mediaConfig,
        resendConfig,
        firebaseConfig,
      ],
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
    SchedulingModule,
    LinkedInModule,
    CreditsModule,
    GenerationModule,
    CalendarGenerationModule,
    CouncilModule,
    MediaGenerationModule,
    MediaTemplatesModule,
    AutopilotModule,
    BillingModule,
    ApprovalShareModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
