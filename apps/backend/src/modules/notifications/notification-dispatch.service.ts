import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
  NotificationType,
  User,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NOTIFICATION_DELIVERY_QUEUE } from './notifications.constants';
import { buildDeliveryJobId } from './notification-dispatch.utils';

export interface NotificationDeliveryJobPayload {
  notificationId: string;
  channel: NotificationDeliveryChannel;
}

const redisEnabled = Boolean(process.env.REDIS_URL);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class NotificationDispatchService implements OnModuleInit {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @InjectQueue(NOTIFICATION_DELIVERY_QUEUE)
    private readonly queue?: Queue<NotificationDeliveryJobPayload>,
  ) {}

  async onModuleInit() {
    if (!redisEnabled || !this.queue) {
      return;
    }

    const retryableFailed = await this.prisma.notificationDelivery.updateMany({
      where: {
        status: NotificationDeliveryStatus.failed,
        error: { contains: 'could not be resolved', mode: 'insensitive' },
      },
      data: {
        status: NotificationDeliveryStatus.pending,
        error: null,
      },
    });

    const pending = await this.prisma.notificationDelivery.findMany({
      where: { status: NotificationDeliveryStatus.pending },
      orderBy: { createdAt: 'asc' },
      select: { notificationId: true, channel: true },
    });

    if (pending.length === 0) {
      return;
    }

    this.logger.log(
      `Replaying ${pending.length} pending notification delivery job(s)` +
        (retryableFailed.count > 0
          ? ` (${retryableFailed.count} failed delivery row(s) reset)`
          : ''),
    );

    for (const delivery of pending) {
      try {
        await this.enqueue({
          notificationId: delivery.notificationId,
          channel: delivery.channel,
        });
        await sleep(250);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to replay delivery for ${delivery.notificationId} (${delivery.channel}): ${message}`,
        );
      }
    }
  }

  async dispatchForUser(
    user: Pick<
      User,
      | 'id'
      | 'email'
      | 'emailGenerationComplete'
      | 'emailPublishAlerts'
      | 'emailWeeklyReminders'
      | 'emailProductUpdates'
      | 'pushEnabled'
    >,
    notification: {
      id: string;
      type: NotificationType;
    },
  ) {
    const channels: NotificationDeliveryChannel[] = [];

    if (this.shouldSendEmail(user, notification.type)) {
      channels.push(NotificationDeliveryChannel.email);
    }

    if (user.pushEnabled) {
      const tokenCount = await this.prisma.pushDeviceToken.count({
        where: { userId: user.id, revokedAt: null },
      });
      if (tokenCount > 0) {
        channels.push(NotificationDeliveryChannel.push);
      }
    }

    for (const channel of channels) {
      const delivery = await this.prisma.notificationDelivery.upsert({
        where: {
          notificationId_channel: {
            notificationId: notification.id,
            channel,
          },
        },
        create: {
          notificationId: notification.id,
          channel,
          status: NotificationDeliveryStatus.pending,
        },
        update: {},
      });

      if (delivery.status === NotificationDeliveryStatus.sent) {
        continue;
      }

      await this.enqueue({
        notificationId: notification.id,
        channel,
      });
    }
  }

  private shouldSendEmail(
    user: Pick<
      User,
      | 'emailGenerationComplete'
      | 'emailPublishAlerts'
      | 'emailWeeklyReminders'
      | 'emailProductUpdates'
    >,
    type: NotificationType,
  ): boolean {
    switch (type) {
      case NotificationType.generation_complete:
      case NotificationType.post_ready_for_approval:
        return user.emailGenerationComplete;
      case NotificationType.publish_succeeded:
      case NotificationType.publish_failed:
        return user.emailPublishAlerts;
      case NotificationType.weekly_content_reminder:
        return user.emailWeeklyReminders;
      case NotificationType.product_update:
        return user.emailProductUpdates;
      case NotificationType.client_approved:
      case NotificationType.client_requested_changes:
        return true;
      default:
        return false;
    }
  }

  private buildDeliveryJobId(payload: NotificationDeliveryJobPayload): string {
    return buildDeliveryJobId(payload);
  }

  private async enqueue(payload: NotificationDeliveryJobPayload) {
    if (redisEnabled && this.queue) {
      const jobId = this.buildDeliveryJobId(payload);
      const existingJob = await this.queue.getJob(jobId);
      if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'failed' || state === 'completed') {
          await existingJob.remove();
        }
      }

      await this.queue.add('deliver', payload, {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      return;
    }

    this.logger.warn(
      `Redis unavailable; skipping async delivery for ${payload.notificationId} (${payload.channel})`,
    );
  }
}
