import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { buildPost, postId, userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SchedulingService } from './scheduling.service';
import { PublishJobEnqueueService } from '../linkedin/publish-job-enqueue.service';

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  return d;
}

const validScheduledAt = daysFromNow(7);

describe('SchedulingService', () => {
  let service: SchedulingService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };
  const publishJobEnqueueService = {
    isEnabled: jest.fn(() => false),
    assertRedisAvailable: jest.fn(),
    enqueuePublish: jest.fn(),
    cancelPublish: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string, defaultValue: number) => defaultValue),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: ConfigService, useValue: configService },
        { provide: PublishJobEnqueueService, useValue: publishJobEnqueueService },
      ],
    }).compile();

    service = module.get(SchedulingService);
  });

  it('schedules an approved post', async () => {
    const approved = buildPost({ status: PostPackageStatus.approved });
    prisma.postPackage.findFirst.mockResolvedValue({
      ...approved,
      _count: { versions: 1 },
    });
    prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      id: workspaceId,
      ownerId: userId,
    });
    prisma.postPackage.updateMany.mockResolvedValue({ count: 1 });
    prisma.postPackage.findFirstOrThrow.mockResolvedValue({
      ...approved,
      status: PostPackageStatus.scheduled,
      scheduledAt: validScheduledAt,
      _count: { versions: 1 },
    });
    publishJobEnqueueService.enqueuePublish.mockResolvedValue(undefined);

    const result = await service.schedule(workspaceId, postId, userId, {
      scheduledAt: validScheduledAt,
    });

    expect(publishJobEnqueueService.assertRedisAvailable).toHaveBeenCalled();
    expect(prisma.postPackage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PostPackageStatus.approved,
        }),
      }),
    );

    expect(workspacesService.assertMember).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(result.status).toBe(PostPackageStatus.scheduled);
    expect(result.scheduledAt).toEqual(validScheduledAt);
  });

  it('reschedules a scheduled post', async () => {
    const scheduled = buildPost({
      status: PostPackageStatus.scheduled,
      scheduledAt: daysFromNow(7),
    });
    const newTime = daysFromNow(8);
    prisma.postPackage.findFirst.mockResolvedValue({
      ...scheduled,
      _count: { versions: 1 },
    });
    prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      id: workspaceId,
      ownerId: userId,
    });
    prisma.postPackage.update.mockResolvedValue({
      ...scheduled,
      scheduledAt: newTime,
      _count: { versions: 1 },
    });
    publishJobEnqueueService.enqueuePublish.mockResolvedValue(undefined);

    const result = await service.reschedule(workspaceId, postId, userId, {
      scheduledAt: newTime,
    });

    expect(publishJobEnqueueService.assertRedisAvailable).toHaveBeenCalled();

    expect(result.scheduledAt).toEqual(newTime);
  });

  it('cancels schedule and returns to approved', async () => {
    const scheduled = buildPost({
      status: PostPackageStatus.scheduled,
      scheduledAt: validScheduledAt,
    });
    prisma.postPackage.findFirst.mockResolvedValue({
      ...scheduled,
      _count: { versions: 1 },
    });
    prisma.postPackage.update.mockResolvedValue({
      ...scheduled,
      status: PostPackageStatus.approved,
      scheduledAt: null,
      _count: { versions: 1 },
    });

    const result = await service.cancelSchedule(workspaceId, postId, userId);

    expect(result.status).toBe(PostPackageStatus.approved);
    expect(result.scheduledAt).toBeNull();
  });

  it('rejects schedule from draft', async () => {
    prisma.postPackage.findFirst.mockResolvedValue({
      ...buildPost({ status: PostPackageStatus.draft }),
      _count: { versions: 1 },
    });

    await expect(
      service.schedule(workspaceId, postId, userId, {
        scheduledAt: validScheduledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists upcoming scheduled posts', async () => {
    prisma.postPackage.findMany.mockResolvedValue([
      {
        ...buildPost({
          status: PostPackageStatus.scheduled,
          scheduledAt: validScheduledAt,
        }),
        _count: { versions: 1 },
      },
    ]);

    const result = await service.listUpcoming(workspaceId, userId, {});

    expect(result).toHaveLength(1);
    expect(prisma.postPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PostPackageStatus.scheduled,
        }),
        orderBy: { scheduledAt: 'asc' },
      }),
    );
  });
});
