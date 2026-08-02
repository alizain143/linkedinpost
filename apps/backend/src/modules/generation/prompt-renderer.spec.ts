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

  it('renders quick-draft v4 messages with placeholders replaced', () => {
    const messages = renderer.renderQuickDraftV4(context);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('format "concise"');
    expect(messages[0].content).toContain('pattern_interrupt');
    expect(messages[0].content).toContain('burning intrigue');
    expect(messages[0].content).toContain('targeted benefit');
    expect(messages[0].content).toContain('No em dashes or en dashes');
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
    const messages = renderer.renderQuickDraftV4({
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

  it('council-writer includes hook/CTA + anti-slop bans and tighter body length', () => {
    const messages = renderer.renderFlow('council-writer', 1, context, {
      agentRole: CouncilAgentRole.writer,
    });

    expect(messages[0].content).toContain('burning intrigue');
    expect(messages[0].content).toContain('No em dashes or en dashes');
    expect(messages[0].content).toContain('The fix is not X');
    expect(messages[0].content).toContain('~500–1000');
  });

  it('council-editor preserves hook/CTA and applies anti-slop bans', () => {
    const messages = renderer.renderFlow('council-editor', 1, context, {
      agentRole: CouncilAgentRole.editor,
    });

    expect(messages[0].content).toContain('Hook intrigue + targeted benefit');
    expect(messages[0].content).toContain('Soft specific CTA');
    expect(messages[0].content).toContain('No em dashes or en dashes');
    expect(messages[0].content).toContain('Allowed polish only');
  });

  it('revise-draft includes anti-slop bans and ~500–1000 body guidance', () => {
    const messages = renderer.renderFlow('revise-draft', 1, context);

    expect(messages[0].content).toContain('No em dashes or en dashes');
    expect(messages[0].content).toContain('~500–1000');
    expect(messages[0].content).toContain('burning intrigue');
  });

  it('calendar-planner prefers concrete curiosity-friendly topics', () => {
    const messages = renderer.renderFlow('calendar-planner', 1, context);

    expect(messages[0].content).toContain('curiosity-friendly topics');
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
