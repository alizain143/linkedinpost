import { Test, TestingModule } from '@nestjs/testing';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const prisma = createMockPrismaService();

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(async (callback) =>
      callback(prisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('revokes older tokens for the same user agent when registering', async () => {
    prisma.pushDeviceToken.findUnique.mockResolvedValue(null);
    prisma.pushDeviceToken.create.mockResolvedValue({
      id: 'device-1',
      token: 'new-token',
      userId,
    });
    prisma.pushDeviceToken.updateMany.mockResolvedValue({ count: 2 });
    prisma.pushDeviceToken.findMany.mockResolvedValue([
      { id: 'device-1' },
      { id: 'device-2' },
    ]);

    await service.registerDevice(userId, 'new-token', 'Mozilla/5.0 Test');

    expect(prisma.pushDeviceToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          userAgent: 'Mozilla/5.0 Test',
          token: { not: 'new-token' },
          revokedAt: null,
        }),
      }),
    );
  });

  it('skips duplicate backend registration when token already exists', async () => {
    prisma.pushDeviceToken.findUnique.mockResolvedValue({
      id: 'device-1',
      token: 'same-token',
      userAgent: 'Mozilla/5.0 Test',
    });
    prisma.pushDeviceToken.update.mockResolvedValue({
      id: 'device-1',
      token: 'same-token',
      userId,
    });
    prisma.pushDeviceToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.pushDeviceToken.findMany.mockResolvedValue([{ id: 'device-1' }]);

    await service.registerDevice(userId, 'same-token', 'Mozilla/5.0 Test');

    expect(prisma.pushDeviceToken.create).not.toHaveBeenCalled();
    expect(prisma.pushDeviceToken.update).toHaveBeenCalled();
  });
});
