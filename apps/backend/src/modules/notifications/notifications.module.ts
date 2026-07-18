import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import firebaseConfig from '../../config/firebase.config';
import resendConfig from '../../config/resend.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NOTIFICATION_DELIVERY_QUEUE } from './notifications.constants';
import { NotificationDeliveryProcessor } from './processors/notification-delivery.processor';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationEventService } from './notification-event.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WeeklyReminderJob } from './weekly-reminder.job';
import { FcmPushSender } from './senders/fcm-push.sender';
import { ResendEmailSender } from './senders/resend-email.sender';

const redisEnabled = Boolean(process.env.REDIS_URL);

@Global()
@Module({
  imports: [
    AuthModule,
    ConfigModule.forFeature(resendConfig),
    ConfigModule.forFeature(firebaseConfig),
    PrismaModule,
    ...(redisEnabled
      ? [
          BullModule.registerQueue({
            name: NOTIFICATION_DELIVERY_QUEUE,
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
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatchService,
    NotificationEventService,
    ResendEmailSender,
    FcmPushSender,
    WeeklyReminderJob,
    ...(redisEnabled ? [NotificationDeliveryProcessor] : []),
  ],
  exports: [NotificationEventService, ResendEmailSender],
})
export class NotificationsModule {}
