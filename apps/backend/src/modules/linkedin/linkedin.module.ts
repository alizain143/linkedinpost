import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import linkedinConfig from '../../config/linkedin.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
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
  LinkedInPostController,
} from './linkedin.controller';
import { PublishJobEnqueueService } from './publish-job-enqueue.service';
import { PublishJobProcessor } from './publish-job.processor';
import { PublishReconcileService } from './publish-reconcile.service';

const redisEnabled = Boolean(process.env.REDIS_URL);

@Module({
  imports: [
    ConfigModule.forFeature(linkedinConfig),
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
  controllers: [LinkedInController, LinkedInPostController],
  providers: [
    ClerkOAuthService,
    LinkedInApiClient,
    LinkedInConnectionService,
    LinkedInProfileService,
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
