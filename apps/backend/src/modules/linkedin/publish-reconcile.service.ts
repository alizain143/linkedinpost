import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishJobEnqueueService } from './publish-job-enqueue.service';

@Injectable()
export class PublishReconcileService implements OnModuleInit {
  private readonly logger = new Logger(PublishReconcileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publishJobEnqueueService: PublishJobEnqueueService,
  ) {}

  async onModuleInit() {
    if (!this.publishJobEnqueueService.isEnabled()) return;

    const scheduledPosts = await this.prisma.postPackage.findMany({
      where: {
        status: PostPackageStatus.scheduled,
        scheduledAt: { not: null },
      },
      include: {
        workspace: { select: { ownerId: true } },
      },
    });

    for (const post of scheduledPosts) {
      if (!post.scheduledAt) continue;
      try {
        await this.publishJobEnqueueService.enqueuePublish(
          post.id,
          post.scheduledAt,
          post.workspace.ownerId,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to reconcile publish job for post ${post.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}
