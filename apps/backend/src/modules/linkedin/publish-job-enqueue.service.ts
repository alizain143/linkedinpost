import {
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { REDIS_ENABLED } from '../job-queue/job-queue.constants';
import { PUBLISH_JOBS_QUEUE } from './linkedin.constants';

export interface PublishJobPayload {
  postPackageId: string;
  ownerUserId: string;
  scheduledAt: string;
}

@Injectable()
export class PublishJobEnqueueService {
  private readonly logger = new Logger(PublishJobEnqueueService.name);

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
    return `publish-${postPackageId}`;
  }

  private isLockedJobError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.toLowerCase().includes('locked by another worker')
    );
  }

  /** Remove a job if present and not actively locked. Returns false if locked/active. */
  private async tryRemoveJob(job: Job | undefined): Promise<boolean> {
    if (!job) return true;

    try {
      const state = await job.getState();
      if (state === 'active') {
        return false;
      }
      await job.remove();
      return true;
    } catch (error) {
      if (this.isLockedJobError(error)) {
        return false;
      }
      throw error;
    }
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

    const jobId = this.jobId(postPackageId);
    const existing = await this.queue!.getJob(jobId);
    const removed = await this.tryRemoveJob(existing);
    if (!removed) {
      this.logger.warn(
        `Skipping re-enqueue for ${jobId}; job is active or locked by another worker`,
      );
      return;
    }

    await this.queue!.add('publish', payload, {
      jobId,
      delay: delayMs,
    });
  }

  async cancelPublish(postPackageId: string) {
    if (!this.isEnabled()) return;
    const existing = await this.queue!.getJob(this.jobId(postPackageId));
    const removed = await this.tryRemoveJob(existing);
    if (!removed) {
      this.logger.warn(
        `Could not cancel ${this.jobId(postPackageId)}; job is active or locked`,
      );
    }
  }
}
