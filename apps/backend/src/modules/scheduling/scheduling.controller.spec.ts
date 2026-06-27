import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { userId, workspaceId } from '../../test/fixtures';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe('SchedulingController', () => {
  let controller: SchedulingController;
  const schedulingService = { listUpcoming: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [{ provide: SchedulingService, useValue: schedulingService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(AllowGuard)
      .compile();

    controller = module.get(SchedulingController);
  });

  it('delegates list upcoming to service', async () => {
    schedulingService.listUpcoming.mockResolvedValue([]);

    await controller.listUpcoming(
      { id: userId } as never,
      workspaceId,
      { limit: 10 },
    );

    expect(schedulingService.listUpcoming).toHaveBeenCalledWith(
      workspaceId,
      userId,
      { limit: 10 },
    );
  });
});
