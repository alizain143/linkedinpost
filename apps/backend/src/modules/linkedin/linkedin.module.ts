import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import linkedinConfig from '../../config/linkedin.config';
import openaiConfig from '../../config/openai.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationModule } from '../generation/generation.module';
import { MediaModule } from '../media/media.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { REDIS_ENABLED } from '../job-queue/job-queue.constants';
import { PUBLISH_JOBS_QUEUE } from './linkedin.constants';
import { ClerkOAuthService } from './clerk-oauth.service';
import { LinkedInApiClient } from './linkedin-api.client';
import {
  LinkedInConnectionService,
  LinkedInProfileService,
  LinkedInPublishService,
} from './linkedin.services';
import {
  LinkedInController,
  WorkspaceLinkedInController,
  LinkedInPostController,
} from './linkedin.controller';
import {
  LinkedInProfileImportController,
  WorkspaceLinkedInImportAuthController,
} from './linkedin-profile-import.controller';
import { LinkedInOAuthController } from './linkedin-oauth.controller';
import { LinkedInOAuthService } from './linkedin-oauth.service';
import { LinkedInProfileImportService } from './linkedin-profile-import.service';
import { LinkedInProfileSnapshotExtractService } from './linkedin-profile-snapshot-extract.service';
import { LinkedInProfileSnapshotOutputParser } from './linkedin-profile-snapshot-output.parser';
import { ProfileImportTokenService } from './profile-import-token.service';
import { PublishJobEnqueueService } from './publish-job-enqueue.service';
import { PublishJobProcessor } from './publish-job.processor';
import { PublishReconcileService } from './publish-reconcile.service';

const redisEnabled = Boolean(process.env.REDIS_URL);

@Module({
  imports: [
    ConfigModule.forFeature(linkedinConfig),
    ConfigModule.forFeature(openaiConfig),
    forwardRef(() => GenerationModule),
    PrismaModule,
    AuthModule,
    MediaModule,
    WorkspacesModule,
    ...(redisEnabled
      ? [
          BullModule.registerQueue({
            name: PUBLISH_JOBS_QUEUE,
            defaultJobOptions: {
              attempts: 3,
              backoff: { type: 'exponential', delay: 1000 },
              removeOnComplete: 100,
              removeOnFail: 200,
            },
          }),
        ]
      : []),
  ],
  controllers: [
    LinkedInController,
    WorkspaceLinkedInController,
    LinkedInPostController,
    LinkedInOAuthController,
    LinkedInProfileImportController,
    WorkspaceLinkedInImportAuthController,
  ],
  providers: [
    ClerkOAuthService,
    LinkedInOAuthService,
    LinkedInApiClient,
    LinkedInConnectionService,
    LinkedInProfileService,
    LinkedInProfileImportService,
    LinkedInProfileSnapshotExtractService,
    LinkedInProfileSnapshotOutputParser,
    ProfileImportTokenService,
    LinkedInPublishService,
    PublishJobEnqueueService,
    PublishReconcileService,
    { provide: REDIS_ENABLED, useValue: redisEnabled },
    ...(redisEnabled ? [PublishJobProcessor] : []),
  ],
  exports: [
    PublishJobEnqueueService,
    LinkedInConnectionService,
    LinkedInProfileService,
  ],
})
export class LinkedInModule {}
