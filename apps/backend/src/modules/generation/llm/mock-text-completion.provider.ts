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
    const system =
      request.messages.find((m) => m.role === 'system')?.content ?? '';

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
      const isRevisionReview = /"revisionAttempt":\s*[2-9]/.test(user);
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
          altText: 'LinkedIn post visual featuring the post hook',
          imagePrompt:
            'Navy gradient background, bold white sans-serif typography, centered layout, professional founder tone',
          width: 1200,
          height: 630,
          styleNotes: 'Professional founder tone',
        }),
        model: 'mock-text',
        usage: { inputTokens: 20, outputTokens: 30 },
      };
    }

    if (system.includes('on-image copy and a visual brief for a branded LinkedIn media template')) {
      return {
        content: JSON.stringify({
          headline: 'Most Founders Skip This Step.',
          headlineHighlight: 'Skip This Step.',
          subhead: 'A simple system beats random posting every time.',
          visualPrompt:
            'Minimal flat illustration of a content calendar and checklist on a clean white background, navy and violet accents, no text, professional LinkedIn style',
          altText: 'Identity card with founder headline about content systems',
        }),
        model: 'mock-text',
        usage: { inputTokens: 20, outputTokens: 30 },
      };
    }

    if (system.includes('design LinkedIn post media templates')) {
      return {
        content: JSON.stringify({
          name: 'AI Identity Card',
          description: 'Four-corner identity layout from AI',
          width: 1080,
          height: 1080,
          layout: {
            version: 1,
            background: { color: '#FFFFFF' },
            elements: [
              {
                id: 'avatar',
                type: 'avatar',
                x: 64,
                y: 56,
                size: 48,
                bind: 'profile.avatar',
              },
              {
                id: 'name',
                type: 'text',
                x: 128,
                y: 64,
                w: 400,
                bind: 'profile.name',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#0A0A0A',
                  align: 'left',
                },
              },
              {
                id: 'title',
                type: 'text',
                x: 560,
                y: 68,
                w: 456,
                bind: 'profile.roleTitle',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 26,
                  fontWeight: 500,
                  color: '#0A0A0A',
                  align: 'right',
                },
              },
              {
                id: 'headline',
                type: 'post_headline',
                x: 80,
                y: 160,
                w: 920,
                style: {
                  fontFamily: 'Inter',
                  fontSize: 48,
                  fontWeight: 800,
                  color: '#0A0A0A',
                  align: 'center',
                  highlightColor: '#0056D2',
                },
              },
              {
                id: 'subhead',
                type: 'post_subhead',
                x: 120,
                y: 340,
                w: 840,
                style: {
                  fontFamily: 'Inter',
                  fontSize: 26,
                  fontWeight: 400,
                  color: '#3F3F46',
                  align: 'center',
                },
              },
              {
                id: 'visual',
                type: 'visual_zone',
                x: 80,
                y: 440,
                w: 920,
                h: 500,
              },
              {
                id: 'footer_left',
                type: 'text',
                x: 64,
                y: 1000,
                w: 480,
                bind: 'static',
                value: 'Frontend | Backend | App scaling',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 20,
                  fontWeight: 500,
                  color: '#0A0A0A',
                  align: 'left',
                },
              },
              {
                id: 'footer_right',
                type: 'text',
                x: 560,
                y: 1000,
                w: 456,
                bind: 'static',
                value: 'Save & Repost',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 20,
                  fontWeight: 500,
                  color: '#0A0A0A',
                  align: 'right',
                },
              },
            ],
          },
        }),
        model: 'mock-text',
        usage: { inputTokens: 40, outputTokens: 120 },
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
      const compactDates = user.match(/dates:\s*([^\n]+)/)?.[1] ?? '';
      const dates = compactDates
        .split(',')
        .map((date) => date.trim())
        .filter(Boolean);

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

    if (system.includes('exactly 1 post')) {
      const user =
        request.messages.find((m) => m.role === 'user')?.content ?? '';
      const avoidCount = (user.match(/variant_\d+:/g) ?? []).length;
      const regenVariants = [
        {
          hook: 'Your content strategy is missing this layer.',
          body: 'Everyone talks about posting more. Almost nobody talks about the system underneath.\n\nI rebuilt mine from scratch last year. Three shifts changed everything.',
          cta: 'What layer is missing in yours?',
          tags: ['contentstrategy', 'founders', 'systems'],
          postType: PostType.how_to,
          tone: 'Direct',
          pillar: 'Founder lessons',
        },
        {
          hook: 'I stopped chasing reach and started doing this instead.',
          body: 'Vanity metrics lied to me for two years.\n\nThe fix was not more posts. It was sharper positioning and one repeatable format.',
          cta: 'What metric do you ignore now?',
          tags: ['linkedin', 'positioning', 'growth'],
          postType: PostType.contrarian_take,
          tone: 'Provocative',
          pillar: 'Audience building',
        },
        {
          hook: '4 signs your LinkedIn posts are too generic.',
          body: '1. Every hook sounds like a template.\n2. Your CTA asks for comments, not action.\n3. The body could belong to anyone in your industry.\n4. You never reference a real moment from your week.',
          cta: 'Which sign hits closest?',
          tags: ['writing', 'personalbrand', 'b2b'],
          postType: PostType.list_post,
          tone: 'Bold',
          pillar: 'Founder lessons',
        },
        {
          hook: 'The post that changed my inbound pipeline was not the clever one.',
          body: 'It was the plainest story I had.\n\nOne client problem. One decision. One outcome. That was it.',
          cta: 'Save this if you are overthinking your next post.',
          tags: ['inbound', 'storytelling', 'saas'],
          postType: PostType.personal_story,
          tone: 'Bold',
          pillar: 'Founder lessons',
        },
      ];

      return {
        content: JSON.stringify(
          regenVariants[avoidCount % regenVariants.length],
        ),
        model: 'mock-text',
        usage: { inputTokens: 30, outputTokens: 50 },
      };
    }

    if (system.includes('pick the single best one to publish')) {
      return {
        content: JSON.stringify({
          recommendedIndex: 0,
          reason:
            'Strongest hook and clearest personal story — most likely to stop the scroll.',
        }),
        model: 'mock-text',
        usage: { inputTokens: 40, outputTokens: 30 },
      };
    }

    if (system.includes('You extract structured LinkedIn profile')) {
      return {
        content: JSON.stringify({
          headline: 'Business Development Manager at StackNovaTech',
          summary:
            'I help businesses build and grow their digital presence from the ground up.',
          positions: [
            {
              title: 'Business Development Manager',
              companyName: 'StackNovaTech',
              description:
                'At Stack Nova, I bridge the gap between what businesses need and what technology can deliver.',
              isCurrent: true,
            },
          ],
          education: [],
          skills: ['Business Development Support', 'Sales'],
        }),
        model: 'mock-text',
        usage: { inputTokens: 200, outputTokens: 120 },
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
