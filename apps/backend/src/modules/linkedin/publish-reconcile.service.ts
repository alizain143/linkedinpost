import { Injectable, OnModuleInit } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishJobEnqueueService } from './publish-job-enqueue.service';

@Injectable()
export class PublishReconcileService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishJobEnqueueService: PublishJobEnqueueService,
  ) {}

  async onModuleInit() {
    if (!this.publishJobEnqueueService.isEnabled()) return;

    const now = new Date();
    const scheduledPosts = await this.prisma.postPackage.findMany({
      where: {
        status: PostPackageStatus.scheduled,
        scheduledAt: { gt: now },
      },
      include: {
        workspace: { select: { ownerId: true } },
      },
    });

    for (const post of scheduledPosts) {
      if (!post.scheduledAt) continue;
      await this.publishJobEnqueueService.enqueuePublish(
        post.id,
        post.scheduledAt,
        post.workspace.ownerId,
      );
    }
  }
}
