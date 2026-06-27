import {
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { REDIS_ENABLED } from '../job-queue/job-queue.constants';
import { PUBLISH_JOBS_QUEUE } from './linkedin.constants';

export interface PublishJobPayload {
  postPackageId: string;
  ownerUserId: string;
  scheduledAt: string;
}

@Injectable()
export class PublishJobEnqueueService {
  constructor(
    @Inject(REDIS_ENABLED) private readonly redisEnabled: boolean,
    @Optional()
    @InjectQueue(PUBLISH_JOBS_QUEUE)
    private readonly queue?: Queue,
  ) {}

  isEnabled() {
    return this.redisEnabled && Boolean(this.queue);
  }

  assertRedisAvailable() {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException({
        error: 'Redis is required for scheduled publish jobs',
        code: 'REDIS_UNAVAILABLE',
      });
    }
  }

  private jobId(postPackageId: string) {
    return `publish:${postPackageId}`;
  }

  async enqueuePublish(
    postPackageId: string,
    scheduledAt: Date,
    ownerUserId: string,
  ) {
    this.assertRedisAvailable();

    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
    const payload: PublishJobPayload = {
      postPackageId,
      ownerUserId,
      scheduledAt: scheduledAt.toISOString(),
    };

    const existing = await this.queue!.getJob(this.jobId(postPackageId));
    await existing?.remove();

    await this.queue!.add('publish', payload, {
      jobId: this.jobId(postPackageId),
      delay: delayMs,
    });
  }

  async cancelPublish(postPackageId: string) {
    if (!this.isEnabled()) return;
    const existing = await this.queue!.getJob(this.jobId(postPackageId));
    await existing?.remove();
  }
}
