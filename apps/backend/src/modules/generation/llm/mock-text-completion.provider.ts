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
    _request: TextCompletionRequest,
  ): Promise<TextCompletionResponse> {
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
    };
  }
}
