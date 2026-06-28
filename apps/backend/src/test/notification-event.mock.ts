import { NotificationEventService } from '../modules/notifications/notification-event.service';

export function createMockNotificationEventService() {
  return {
    emit: jest.fn().mockResolvedValue(undefined),
    emitGenerationComplete: jest.fn().mockResolvedValue(undefined),
    emitPostReadyForApproval: jest.fn().mockResolvedValue(undefined),
    emitPublishResult: jest.fn().mockResolvedValue(undefined),
    emitClientApprovalAction: jest.fn().mockResolvedValue(undefined),
    emitWeeklyReminder: jest.fn().mockResolvedValue(undefined),
  };
}

export function mockNotificationEventServiceProvider(
  service: ReturnType<typeof createMockNotificationEventService> = createMockNotificationEventService(),
) {
  return {
    provide: NotificationEventService,
    useValue: service,
  };
}
