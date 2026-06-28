import { CouncilAgentRole } from '@prisma/client';
import { PromptRenderer } from './prompt-renderer';
import { GenerationContext, CouncilPriorStep } from './generation.types';
import { ContentGoal, PostType, UserPlan } from '@prisma/client';
import { projectPriorSteps } from './prompts/prior-steps-projector';
import { PROMPT_FIELD_LIMITS } from './prompts/prompt-text.util';

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
      calendarSlotDates: ['2026-07-01', '2026-07-03'],
      calendarSlotCount: 2,
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
    expect(messages[1].content).toContain('Maya');
    expect(messages[1].content).toContain('Weekly shipping');
    expect(messages[1].content).toContain('Lessons, Growth');
    expect(messages[1].content).toContain('brief.pdf');
    expect(messages[1].content).toContain('<profile>');
    expect(messages[1].content).not.toContain('{{');
  });

  it('truncates long writing samples', () => {
    const longSample = 'a'.repeat(PROMPT_FIELD_LIMITS.writingSample + 50);
    const messages = renderer.renderQuickDraftV1({
      ...context,
      contentProfile: {
        ...context.contentProfile!,
        writingSample: longSample,
      },
    });

    expect(messages[1].content).toContain('…');
    expect(messages[1].content).not.toContain(longSample);
  });

  it('injects council pass score into reviewer system prompt', () => {
    const messages = renderer.renderFlow('council-reviewer', 1, context, {
      agentRole: CouncilAgentRole.reviewer,
      passScore: 90,
    });

    expect(messages[0].content).toContain('overall ≥ 90');
  });

  it('uses compact calendar dates', () => {
    const messages = renderer.renderFlow('calendar-planner', 1, context);

    expect(messages[1].content).toContain('dates: 2026-07-01,2026-07-03');
    expect(messages[1].content).not.toContain('"date"');
  });

  it('projects prior steps for reviewer agent', () => {
    const priorSteps: CouncilPriorStep[] = [
      {
        agentRole: CouncilAgentRole.writer,
        revisionAttempt: 1,
        output: {
          hook: 'Hook',
          body: 'Body',
          cta: 'CTA',
          tags: ['a'],
          rationale: 'Long rationale that should be stripped',
        },
      },
      {
        agentRole: CouncilAgentRole.reviewer,
        revisionAttempt: 1,
        output: { overall: 70, feedback: 'Needs work' },
      },
    ];

    const projected = projectPriorSteps(CouncilAgentRole.reviewer, priorSteps);
    expect(projected).toHaveLength(1);
    expect(projected[0].output).toEqual({
      hook: 'Hook',
      body: 'Body',
      cta: 'CTA',
      tags: ['a'],
    });
    expect(projected[0].output).not.toHaveProperty('rationale');
  });
});

describe('projectPriorSteps', () => {
  it('returns reviewer feedback for writer revision', () => {
    const priorSteps: CouncilPriorStep[] = [
      {
        agentRole: CouncilAgentRole.writer,
        revisionAttempt: 1,
        output: { hook: 'h', body: 'b', cta: 'c', tags: [] },
      },
      {
        agentRole: CouncilAgentRole.reviewer,
        revisionAttempt: 1,
        output: {
          feedback: 'Fix hook',
          revisionHints: ['Shorten hook'],
          overall: 60,
          hook: 50,
          voice: 60,
          clarity: 70,
        },
      },
    ];

    const projected = projectPriorSteps(CouncilAgentRole.writer, priorSteps);
    expect(projected[0].agentRole).toBe(CouncilAgentRole.reviewer);
    expect(projected[0].output.feedback).toBe('Fix hook');
  });
});
