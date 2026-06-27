import { PromptRenderer } from './prompt-renderer';
import { GenerationContext } from './generation.types';
import { ContentGoal, PostType, UserPlan } from '@prisma/client';

describe('PromptRenderer', () => {
  const renderer = new PromptRenderer();

  const context: GenerationContext = {
    workspaceId: 'ws',
    userId: 'user',
    contentProfileId: 'profile',
    user: {
      id: 'user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      timezone: 'America/New_York',
      plan: UserPlan.pro,
    },
    contentProfile: {
      id: 'profile',
      name: 'Maya',
      roleTitle: 'Founder',
      industry: 'SaaS',
      targetAudience: 'Founders',
      contentGoal: ContentGoal.build_authority,
      preferredTone: 'Bold',
      offerDescription: 'Coaching',
      writingSample: 'Sample',
      avoidWords: 'synergy',
      pillars: ['Lessons', 'Growth'],
    },
    input: {
      topic: 'Weekly shipping',
      postType: PostType.personal_story,
      tone: 'Bold',
      pillar: 'Lessons',
      additionalContext: 'Launch week',
    },
    documents: [
      {
        id: 'doc-1',
        filename: 'brief.pdf',
        mimeType: 'application/pdf',
      },
    ],
  };

  it('renders quick-draft v1 messages with placeholders replaced', () => {
    const messages = renderer.renderQuickDraftV1(context);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('Test User');
    expect(messages[1].content).toContain('Weekly shipping');
    expect(messages[1].content).toContain('Lessons, Growth');
    expect(messages[1].content).toContain('brief.pdf');
    expect(messages[1].content).not.toContain('{{');
  });
});
