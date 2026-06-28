import { Inject, Injectable } from '@nestjs/common';
import { ContextAssembler } from '../context/context-assembler';
import { GenerationFlow } from './generation-flow.interface';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import type { ModelRouter } from '../llm/model-capability.types';
import { PromptRenderer } from '../prompt-renderer';
import { TopicSuggestionsOutputParser } from '../topic-suggestions-output.parser';
import {
  TopicSuggestionsInput,
  TopicSuggestionsResult,
} from '../generation.types';

@Injectable()
export class TopicSuggestionsGenerator implements GenerationFlow<
  TopicSuggestionsInput,
  TopicSuggestionsResult
> {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly outputParser: TopicSuggestionsOutputParser,
  ) {}

  async generate(input: TopicSuggestionsInput): Promise<TopicSuggestionsResult> {
    const context = await this.contextAssembler.assemble(input);
    const messages = this.promptRenderer.renderFlow(
      'topic-suggestions',
      1,
      context,
    );
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });
    const parsed = this.outputParser.parse(completion.content);

    return {
      ...parsed,
      promptId: 'topic-suggestions',
      promptVersion: 'v1',
      model: completion.model,
      usage: completion.usage,
    };
  }
}
