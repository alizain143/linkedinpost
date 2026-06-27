import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { userId } from '../../test/fixtures';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { GenerationJobsQueryService } from './generation-jobs-query.service';
import { GenerationJobsController } from './generation-jobs.controller';

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe('GenerationJobsController', () => {
  let controller: GenerationJobsController;
  const generationJobsQueryService = { getJobForUser: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerationJobsController],
      providers: [
        {
          provide: GenerationJobsQueryService,
          useValue: generationJobsQueryService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(AllowGuard)
      .compile();

    controller = module.get(GenerationJobsController);
  });

  it('delegates get job to service', async () => {
    generationJobsQueryService.getJobForUser.mockResolvedValue({ id: 'job-1' });

    const result = await controller.getJob({ id: userId } as never, 'job-1');

    expect(generationJobsQueryService.getJobForUser).toHaveBeenCalledWith(
      'job-1',
      userId,
    );
    expect(result).toEqual({ id: 'job-1' });
  });
});
