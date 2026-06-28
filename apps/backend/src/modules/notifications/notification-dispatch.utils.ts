import { NotificationDeliveryChannel } from '@prisma/client';
import { NotificationDeliveryJobPayload } from './notification-dispatch.service';

export function buildDeliveryJobId(
  payload: NotificationDeliveryJobPayload,
): string {
  return `${payload.notificationId}_${payload.channel}`;
}
