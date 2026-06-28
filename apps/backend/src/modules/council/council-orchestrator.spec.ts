import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GenerationJobStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { mockNotificationEventServiceProvider } from '../../test/notification-event.mock';
import { MediaService } from '../media/media.service';
import { PostsService } from '../posts/posts.service';
import { CouncilAgentService } from './council-agent.service';
import { CouncilEventService } from './council-event.service';
import { CouncilMediaPhaseService } from './council-media-phase.service';
import { CouncilOrchestrator } from './council-orchestrator';

describe('CouncilOrchestrator', () => {
  let orchestrator: CouncilOrchestrator;
  const prisma = createMockPrismaService();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouncilOrchestrator,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: number) => fallback),
          },
        },
        { provide: CouncilAgentService, useValue: {} },
        { provide: CouncilEventService, useValue: {} },
        { provide: PostsService, useValue: {} },
        { provide: MediaService, useValue: {} },
        { provide: CreditsService, useValue: {} },
        { provide: CouncilMediaPhaseService, useValue: {} },
        mockNotificationEventServiceProvider(),
      ],
    }).compile();

    orchestrator = module.get(CouncilOrchestrator);
  });

  it('throws when generation job has no post package', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      userId,
      workspaceId,
      postPackageId: null,
      postPackage: null,
      input: {},
      status: GenerationJobStatus.running,
    });

    await expect(orchestrator.run('job-1')).rejects.toThrow(
      'Council job job-1 missing post package',
    );
  });
});
