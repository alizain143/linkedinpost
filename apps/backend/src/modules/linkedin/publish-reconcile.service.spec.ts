import { PostPackageStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishReconcileService } from './publish-reconcile.service';
import { PublishJobEnqueueService } from './publish-job-enqueue.service';

describe('PublishReconcileService', () => {
  const prisma = createMockPrismaService();
  const publishJobEnqueueService = {
    isEnabled: jest.fn(),
    enqueuePublish: jest.fn(),
  };
  let service: PublishReconcileService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublishReconcileService(
      prisma as unknown as PrismaService,
      publishJobEnqueueService as unknown as PublishJobEnqueueService,
    );
  });

  it('re-enqueues scheduled posts on module init when redis is enabled', async () => {
    publishJobEnqueueService.isEnabled.mockReturnValue(true);
    const scheduledAt = new Date('2026-06-28T12:00:00.000Z');
    prisma.postPackage.findMany.mockResolvedValue([
      {
        id: 'post-1',
        scheduledAt,
        workspace: { ownerId: 'owner-1' },
      },
    ]);

    await service.onModuleInit();

    expect(publishJobEnqueueService.enqueuePublish).toHaveBeenCalledWith(
      'post-1',
      scheduledAt,
      'owner-1',
    );
  });

  it('does nothing when redis queue is disabled', async () => {
    publishJobEnqueueService.isEnabled.mockReturnValue(false);

    await service.onModuleInit();

    expect(prisma.postPackage.findMany).not.toHaveBeenCalled();
  });
});
