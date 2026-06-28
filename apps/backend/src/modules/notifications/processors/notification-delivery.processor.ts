import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import {
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
} from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { NOTIFICATION_DELIVERY_QUEUE } from '../notifications.constants';
import { NotificationDeliveryJobPayload } from '../notification-dispatch.service';
import { FcmPushSender } from '../senders/fcm-push.sender';
import { ResendEmailSender } from '../senders/resend-email.sender';

@Processor(NOTIFICATION_DELIVERY_QUEUE, { concurrency: 1 })
export class NotificationDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDeliveryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSender: ResendEmailSender,
    private readonly pushSender: FcmPushSender,
  ) {
    super();
  }

  async process(job: Job<NotificationDeliveryJobPayload>): Promise<void> {
    const { notificationId, channel } = job.data;

    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: {
        notificationId_channel: { notificationId, channel },
      },
    });

    if (!delivery || delivery.status === NotificationDeliveryStatus.sent) {
      return;
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });

    if (!notification) {
      return;
    }

    try {
      let providerId: string | null = null;

      if (channel === NotificationDeliveryChannel.email) {
        providerId = await this.emailSender.send({
          to: notification.user.email,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          actionUrl: notification.actionUrl,
        });
      } else if (channel === NotificationDeliveryChannel.push) {
        providerId = await this.pushSender.send({
          userId: notification.userId,
          title: notification.title,
          body: notification.body,
          actionUrl: notification.actionUrl,
          notificationId: notification.id,
        });
      }

      if (!providerId) {
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: NotificationDeliveryStatus.failed,
            error: 'Channel not configured or no recipients',
          },
        });
        return;
      }

      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.sent,
          providerId,
          error: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Delivery failed for ${notificationId} (${channel}): ${message}`,
      );

      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationDeliveryStatus.failed,
          error: message,
        },
      });

      throw error;
    }
  }
}
