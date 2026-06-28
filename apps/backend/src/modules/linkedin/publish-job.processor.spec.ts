import { PostPackageStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { LinkedInPublishService } from './linkedin.services';
import { PublishJobProcessor } from './publish-job.processor';

describe('PublishJobProcessor', () => {
  const prisma = createMockPrismaService();
  const linkedInPublishService = { publishPostForOwner: jest.fn() };
  let processor: PublishJobProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new PublishJobProcessor(
      prisma as unknown as PrismaService,
      linkedInPublishService as unknown as LinkedInPublishService,
    );
  });

  it('skips already published posts', async () => {
    prisma.postPackage.findUnique.mockResolvedValue({
      id: 'post-1',
      status: PostPackageStatus.published,
      scheduledAt: new Date('2026-06-28T12:00:00.000Z'),
    });

    await processor.process({
      data: {
        postPackageId: 'post-1',
        scheduledAt: '2026-06-28T12:00:00.000Z',
        ownerUserId: 'owner-1',
      },
    } as never);

    expect(linkedInPublishService.publishPostForOwner).not.toHaveBeenCalled();
  });

  it('publishes scheduled posts when scheduledAt matches payload', async () => {
    const scheduledAt = new Date('2026-06-28T12:00:00.000Z');
    prisma.postPackage.findUnique.mockResolvedValue({
      id: 'post-1',
      status: PostPackageStatus.scheduled,
      scheduledAt,
    });

    await processor.process({
      data: {
        postPackageId: 'post-1',
        scheduledAt: scheduledAt.toISOString(),
        ownerUserId: 'owner-1',
      },
    } as never);

    expect(linkedInPublishService.publishPostForOwner).toHaveBeenCalledWith(
      'post-1',
      'owner-1',
    );
  });
});
