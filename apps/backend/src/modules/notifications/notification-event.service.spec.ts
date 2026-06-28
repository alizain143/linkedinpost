import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationEventService } from './notification-event.service';

describe('NotificationEventService', () => {
  let service: NotificationEventService;

  const prisma = {
    notification: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUniqueOrThrow: jest.fn(),
    },
  };

  const dispatchService = {
    dispatchForUser: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'resend.frontendUrl') return 'http://localhost:3000';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationDispatchService, useValue: dispatchService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(NotificationEventService);
  });

  it('skips duplicate notifications by dedupe key', async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: 'existing' });

    await service.emit({
      userId: 'user-1',
      type: NotificationType.generation_complete,
      dedupeKey: 'generation_complete:job-1',
    });

    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(dispatchService.dispatchForUser).not.toHaveBeenCalled();
  });
});
