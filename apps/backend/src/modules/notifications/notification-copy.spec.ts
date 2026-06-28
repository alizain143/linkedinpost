import { NotificationType } from '@prisma/client';
import { buildNotificationCopy, buildEmailSubject } from './notification-copy';

describe('notification-copy', () => {
  it('builds generation complete copy', () => {
    expect(
      buildNotificationCopy({
        type: NotificationType.generation_complete,
        postHook: 'My hook',
      }),
    ).toEqual({
      title: 'Generation complete',
      body: '"My hook" is ready for review.',
    });
  });

  it('builds email subjects', () => {
    expect(
      buildEmailSubject(NotificationType.publish_failed),
    ).toBe('Publish failed — action needed');
  });
});
