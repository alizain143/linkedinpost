import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PostPackageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PUBLISH_JOBS_QUEUE } from './linkedin.constants';
import { LinkedInPublishService } from './linkedin.services';
import { PublishJobPayload } from './publish-job-enqueue.service';

@Injectable()
@Processor(PUBLISH_JOBS_QUEUE)
export class PublishJobProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly linkedInPublishService: LinkedInPublishService,
  ) {
    super();
  }

  async process(job: Job<PublishJobPayload>) {
    const post = await this.prisma.postPackage.findUnique({
      where: { id: job.data.postPackageId },
    });

    if (!post) return;
    if (post.status === PostPackageStatus.published) return;
    if (
      post.status !== PostPackageStatus.scheduled &&
      post.status !== PostPackageStatus.failed
    ) {
      return;
    }

    const scheduledAt = post.scheduledAt?.toISOString();
    if (!scheduledAt || scheduledAt !== job.data.scheduledAt) return;

    await this.linkedInPublishService.publishPostForOwner(
      job.data.postPackageId,
      job.data.ownerUserId,
    );
  }
}
