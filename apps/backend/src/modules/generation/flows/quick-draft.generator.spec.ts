import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  buildContentProfile,
  buildUser,
  contentProfileId,
  userId,
  workspaceId,
} from '../../../test/fixtures';
import { ContextAssembler } from '../context/context-assembler';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import { MockImageGenerationProvider } from '../llm/mock-image-generation.provider';
import { MockModelRouter } from '../llm/mock-model-router';
import { MockTextCompletionProvider } from '../llm/mock-text-completion.provider';
import { PromptRenderer } from '../prompt-renderer';
import { QuickDraftOutputParser } from '../quick-draft-output.parser';
import { SpecificityCriticOutputParser } from '../specificity-critic-output.parser';
import { SpecificityCriticService } from '../specificity-critic.service';
import { QuickDraftGenerator } from './quick-draft.generator';

describe('QuickDraftGenerator', () => {
  let generator: QuickDraftGenerator;
  const contextAssembler = { assemble: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickDraftGenerator,
        PromptRenderer,
        QuickDraftOutputParser,
        SpecificityCriticOutputParser,
        SpecificityCriticService,
        MockTextCompletionProvider,
        MockImageGenerationProvider,
        MockModelRouter,
        {
          provide: MODEL_ROUTER,
          useExisting: MockModelRouter,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, defaultValue?: number) => defaultValue ?? 70,
          },
        },
        { provide: ContextAssembler, useValue: contextAssembler },
      ],
    }).compile();

    generator = module.get(QuickDraftGenerator);

    const user = buildUser();
    const profile = buildContentProfile();

    contextAssembler.assemble.mockResolvedValue({
      workspaceId,
      userId,
      contentProfileId,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        plan: user.plan,
      },
      contentProfile: {
        id: profile.id,
        name: profile.name,
        roleTitle: profile.roleTitle,
        industry: profile.industry,
        targetAudience: profile.targetAudience,
        contentGoal: profile.contentGoal,
        preferredTone: profile.preferredTone,
        offerDescription: profile.offerDescription,
        writingSample: profile.writingSample,
        avoidWords: profile.avoidWords,
        pillars: ['Founder lessons'],
      },
      input: { topic: 'Shipping weekly' },
    });
  });

  it('runs assemble → render → complete → parse → critic', async () => {
    const result = await generator.generate({
      workspaceId,
      userId,
      topic: 'Shipping weekly',
    });

    expect(contextAssembler.assemble).toHaveBeenCalled();
    expect(result.variants).toHaveLength(3);
    expect(result.model).toBe('mock-text');
    expect(result.promptId).toBe('quick-draft');
    expect(result.promptVersion).toBe('v4');
    expect(result.variants[0]).toMatchObject({
      format: 'concise',
      hook: expect.any(String),
      body: expect.any(String),
      cta: expect.any(String),
      tags: expect.any(Array),
      postType: expect.any(String),
      tone: expect.any(String),
      pillar: expect.any(String),
    });
    expect(result.variants.map((v) => v.format)).toEqual([
      'concise',
      'detailed',
      'pattern_interrupt',
    ]);
  });
});
