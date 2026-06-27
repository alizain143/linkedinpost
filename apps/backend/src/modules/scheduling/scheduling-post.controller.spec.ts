import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { userId, workspaceId, postId } from '../../test/fixtures';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { SchedulingPostController } from './scheduling-post.controller';
import { SchedulingService } from './scheduling.service';

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe('SchedulingPostController', () => {
  let controller: SchedulingPostController;
  const schedulingService = {
    schedule: jest.fn(),
    reschedule: jest.fn(),
    cancelSchedule: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingPostController],
      providers: [{ provide: SchedulingService, useValue: schedulingService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(AllowGuard)
      .compile();

    controller = module.get(SchedulingPostController);
  });

  it('delegates schedule to service', async () => {
    const scheduledAt = new Date('2099-01-01T12:00:00.000Z');
    schedulingService.schedule.mockResolvedValue({ id: postId });

    const result = await controller.schedule(
      { id: userId } as never,
      workspaceId,
      postId,
      { scheduledAt },
    );

    expect(schedulingService.schedule).toHaveBeenCalledWith(
      workspaceId,
      postId,
      userId,
      { scheduledAt },
    );
    expect(result).toEqual({ id: postId });
  });

  it('delegates cancel to service', async () => {
    schedulingService.cancelSchedule.mockResolvedValue({ id: postId });

    await controller.cancelSchedule(
      { id: userId } as never,
      workspaceId,
      postId,
    );

    expect(schedulingService.cancelSchedule).toHaveBeenCalledWith(
      workspaceId,
      postId,
      userId,
    );
  });
});
