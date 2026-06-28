import { NotificationDeliveryChannel } from '@prisma/client';
import { buildDeliveryJobId } from './notification-dispatch.utils';

describe('notification-dispatch.utils', () => {
  it('builds bull-safe job ids without colons', () => {
    const jobId = buildDeliveryJobId({
      notificationId: '8d4d2320-c091-47e2-b1bd-ea2cdefbcb54',
      channel: NotificationDeliveryChannel.email,
    });

    expect(jobId).toBe('8d4d2320-c091-47e2-b1bd-ea2cdefbcb54_email');
    expect(jobId).not.toContain(':');
  });
});
