import { Test, TestingModule } from '@nestjs/testing';
import {
  buildContentProfile,
  buildUser,
  contentProfileId,
  userId,
  workspaceId,
} from '../../../test/fixtures';
import { ContextAssembler } from './context-assembler';
import { ContentProfileContextProvider } from './content-profile-context.provider';
import { DocumentContextProvider } from './document-context.provider';
import { GenerationInputContextProvider } from './generation-input-context.provider';
import { UserContextProvider } from './user-context.provider';
import { PostType } from '@prisma/client';

describe('ContextAssembler', () => {
  let assembler: ContextAssembler;

  const userContextProvider = {
    order: 10,
    provide: jest.fn(),
  };
  const contentProfileContextProvider = {
    order: 20,
    provide: jest.fn(),
  };
  const generationInputContextProvider = {
    order: 30,
    provide: jest.fn(),
  };
  const documentContextProvider = {
    order: 40,
    provide: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextAssembler,
        { provide: UserContextProvider, useValue: userContextProvider },
        {
          provide: ContentProfileContextProvider,
          useValue: contentProfileContextProvider,
        },
        {
          provide: GenerationInputContextProvider,
          useValue: generationInputContextProvider,
        },
        {
          provide: DocumentContextProvider,
          useValue: documentContextProvider,
        },
      ],
    }).compile();

    assembler = module.get(ContextAssembler);
  });

  it('merges provider slices in order and sets contentProfileId', async () => {
    const user = buildUser();
    const profile = buildContentProfile();

    userContextProvider.provide.mockResolvedValue({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        plan: user.plan,
      },
    });
    contentProfileContextProvider.provide.mockResolvedValue({
      contentProfileId: profile.id,
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
    });
    generationInputContextProvider.provide.mockResolvedValue({
      input: { topic: 'Shipping weekly' },
    });
    documentContextProvider.provide.mockResolvedValue({});

    const context = await assembler.assemble({
      workspaceId,
      userId,
      topic: 'Shipping weekly',
      postType: PostType.personal_story,
    });

    expect(userContextProvider.provide.mock.invocationCallOrder[0]).toBeLessThan(
      contentProfileContextProvider.provide.mock.invocationCallOrder[0],
    );
    expect(context.contentProfileId).toBe(contentProfileId);
    expect(context.user?.email).toBe(user.email);
    expect(context.input?.topic).toBe('Shipping weekly');
  });
});
