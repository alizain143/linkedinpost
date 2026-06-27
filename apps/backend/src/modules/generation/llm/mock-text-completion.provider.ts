import { Injectable } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { TextCompletionProvider } from './text-completion-provider.interface';
import {
  TextCompletionRequest,
  TextCompletionResponse,
} from '../generation.types';

@Injectable()
export class MockTextCompletionProvider implements TextCompletionProvider {
  async complete(
    request: TextCompletionRequest,
  ): Promise<TextCompletionResponse> {
    const system = request.messages.find((m) => m.role === 'system')?.content ?? '';

    if (system.includes('Writer agent')) {
      return {
        content: JSON.stringify({
          hook: 'Most founders skip this step.',
          body: 'I spent years posting without a system. Then I built one.',
          cta: 'What is your content system?',
          tags: ['founders', 'linkedin'],
          rationale: 'Personal story angle',
        }),
        model: 'mock-text',
        usage: { inputTokens: 50, outputTokens: 80 },
      };
    }

    if (system.includes('Reviewer agent')) {
      const user =
        request.messages.find((m) => m.role === 'user')?.content ?? '';
      const isRevisionReview = user.includes('"agentRole": "reviewer"');
      const passed = isRevisionReview;
      return {
        content: JSON.stringify({
          overall: passed ? 81 : 68,
          hook: 80,
          voice: passed ? 78 : 65,
          clarity: 70,
          passed,
          feedback: passed
            ? 'Strong hook and voice alignment.'
            : 'Tone drifts in paragraph 2.',
          revisionHints: passed ? [] : ['Shorten hook', 'Match writing sample'],
        }),
        model: 'mock-text',
        usage: { inputTokens: 40, outputTokens: 60 },
      };
    }

    if (system.includes('Editor agent')) {
      return {
        content: JSON.stringify({
          hook: 'Most founders skip this step.',
          body: 'I spent years posting without a system. Then I built one. Here is the framework.',
          cta: 'What is your content system?',
          tags: ['founders', 'linkedin'],
          changelog: 'Tightened body and CTA',
        }),
        model: 'mock-text',
        usage: { inputTokens: 45, outputTokens: 70 },
      };
    }

    if (system.includes('Media Creator agent')) {
      return {
        content: JSON.stringify({
          mediaType: 'quote_card',
          altText: 'Quote card featuring the post hook',
          imagePrompt:
            'Minimal LinkedIn quote card, navy background, white bold headline text, clean sans-serif',
          width: 1200,
          height: 630,
          headlineText: 'Most founders skip this step.',
          styleNotes: 'Professional founder tone',
        }),
        model: 'mock-text',
        usage: { inputTokens: 20, outputTokens: 30 },
      };
    }

    if (system.includes('Media Reviewer agent')) {
      return {
        content: JSON.stringify({
          passed: true,
          issues: [],
          score: 85,
        }),
        model: 'mock-text',
        usage: { inputTokens: 20, outputTokens: 25 },
      };
    }

    if (system.includes('calendar planner')) {
      const user =
        request.messages.find((m) => m.role === 'user')?.content ?? '';
      const dates: string[] = [];
      const dateMatches = user.matchAll(/"date":\s*"(\d{4}-\d{2}-\d{2})"/g);

      for (const match of dateMatches) {
        dates.push(match[1]);
      }

      const slots = dates.map((date, index) => ({
        date,
        topic: `Calendar topic ${index + 1}`,
        pillar: 'Founder lessons',
        postType: PostType.personal_story,
        tone: 'Direct',
      }));

      return {
        content: JSON.stringify({ slots }),
        model: 'mock-text',
        usage: { inputTokens: 30, outputTokens: 80 },
      };
    }

    const variants = [
      {
        hook: 'Most founders skip this step.',
        body: 'I spent years posting without a system. Then I built one.',
        cta: 'What is your content system?',
        tags: ['founders', 'linkedin'],
        postType: PostType.personal_story,
        tone: 'Bold',
        pillar: 'Founder lessons',
      },
      {
        hook: '3 lessons from shipping weekly.',
        body: '1. Consistency beats perfection.\n2. Hooks matter.\n3. Repurpose everything.',
        cta: 'Which lesson resonates?',
        tags: ['content', 'growth'],
        postType: PostType.list_post,
        tone: 'Direct',
        pillar: 'Founder lessons',
      },
      {
        hook: 'Stop writing for everyone.',
        body: 'Pick one audience. Solve one problem. Repeat.',
        cta: 'Who is your one audience?',
        tags: ['strategy'],
        postType: PostType.contrarian_take,
        tone: 'Provocative',
        pillar: 'Audience building',
      },
    ];

    return {
      content: JSON.stringify({ variants }),
      model: 'mock-text',
    };
  }
}
