import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreditTransactionType,
  GenerationJobStatus,
  GenerationJobType,
  PostType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId, workspaceId } from '../../test/fixtures';
import { CreditsService } from '../credits/credits.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { QuickDraftGenerator } from './flows/quick-draft.generator';
import { QuickDraftJobService } from './quick-draft-job.service';

describe('QuickDraftJobService', () => {
  let service: QuickDraftJobService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };
  const quickDraftGenerator = { generate: jest.fn() };
  const creditsService = { consume: jest.fn() };

  const jobId = '77777777-7777-7777-7777-777777777777';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickDraftJobService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: QuickDraftGenerator, useValue: quickDraftGenerator },
        { provide: CreditsService, useValue: creditsService },
      ],
    }).compile();

    service = module.get(QuickDraftJobService);

    prisma.generationJob.create.mockResolvedValue({
      id: jobId,
      workspaceId,
      userId,
      type: GenerationJobType.quick_draft,
      status: GenerationJobStatus.pending,
      flowId: 'quick-draft',
      promptVersion: 'v1',
      model: null,
      input: {},
      result: null,
      errorCode: null,
      errorMessage: null,
      inputTokens: null,
      outputTokens: null,
      creditCost: 1,
      creditCharged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    });

    prisma.generationJob.update.mockImplementation(({ data }) => ({
      id: jobId,
      workspaceId,
      userId,
      type: GenerationJobType.quick_draft,
      status: data.status ?? GenerationJobStatus.completed,
      flowId: 'quick-draft',
      promptVersion: 'v1',
      model: data.model ?? 'mock-text',
      input: {},
      result: data.result ?? { variants: [] },
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
      inputTokens: data.inputTokens ?? null,
      outputTokens: data.outputTokens ?? null,
      creditCost: 1,
      creditCharged: data.creditCharged ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: data.completedAt ?? new Date(),
    }));

    quickDraftGenerator.generate.mockResolvedValue({
      variants: [
        {
          hook: 'Hook',
          body: 'Body',
          cta: 'CTA',
          tags: ['tag'],
          postType: PostType.personal_story,
          tone: 'Bold',
          pillar: 'Lessons',
        },
        {
          hook: 'Hook 2',
          body: 'Body 2',
          cta: 'CTA 2',
          tags: [],
          postType: PostType.list_post,
          tone: 'Direct',
          pillar: 'Lessons',
        },
        {
          hook: 'Hook 3',
          body: 'Body 3',
          cta: 'CTA 3',
          tags: [],
          postType: PostType.how_to,
          tone: 'Warm',
          pillar: 'Lessons',
        },
      ],
      promptId: 'quick-draft',
      promptVersion: 'v1',
      model: 'mock-text',
      usage: { inputTokens: 100, outputTokens: 200 },
    });

    creditsService.consume.mockResolvedValue({
      used: 1,
      remaining: 199,
      limit: 200,
    });
  });

  it('creates job, generates, consumes credit, and completes', async () => {
    const result = await service.runQuickDraft(workspaceId, userId, {
      topic: 'Shipping weekly',
    });

    expect(workspacesService.assertMember).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(prisma.generationJob.create).toHaveBeenCalled();
    expect(quickDraftGenerator.generate).toHaveBeenCalled();
    expect(creditsService.consume).toHaveBeenCalledWith(
      userId,
      1,
      CreditTransactionType.generation,
      { generationJobId: jobId },
    );
    expect(result.status).toBe(GenerationJobStatus.completed);
    expect(result.creditCharged).toBe(true);
    expect(result.result?.variants).toHaveLength(3);
  });

  it('marks job failed and does not consume credits on parse error', async () => {
    quickDraftGenerator.generate.mockRejectedValue(
      new UnprocessableEntityException({
        error: 'bad json',
        code: 'GENERATION_PARSE_ERROR',
      }),
    );

    await expect(
      service.runQuickDraft(workspaceId, userId, { topic: 'Test' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(creditsService.consume).not.toHaveBeenCalled();
    expect(prisma.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: jobId },
        data: expect.objectContaining({
          status: GenerationJobStatus.failed,
          errorCode: 'GENERATION_PARSE_ERROR',
        }),
      }),
    );
  });
});
