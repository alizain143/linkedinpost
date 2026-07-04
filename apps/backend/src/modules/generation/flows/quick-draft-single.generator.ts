import { Inject, Injectable } from '@nestjs/common';
import { ContextAssembler } from '../context/context-assembler';
import { GenerationFlow } from './generation-flow.interface';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import type { ModelRouter } from '../llm/model-capability.types';
import { PromptRenderer } from '../prompt-renderer';
import { QuickDraftSingleOutputParser } from '../quick-draft-single-output.parser';
import {
  QuickDraftInput,
  QuickDraftSingleResult,
} from '../generation.types';

@Injectable()
export class QuickDraftSingleGenerator implements GenerationFlow<
  QuickDraftInput,
  QuickDraftSingleResult
> {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    private readonly outputParser: QuickDraftSingleOutputParser,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  async generate(input: QuickDraftInput): Promise<QuickDraftSingleResult> {
    const context = await this.contextAssembler.assemble(input);
    const messages = this.promptRenderer.renderQuickDraftSingleV1(context);
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });
    const variant = this.outputParser.parse(completion.content);

    return {
      variant,
      promptId: 'quick-draft-single',
      promptVersion: 'v1',
      model: completion.model,
      usage: completion.usage,
    };
  }
}
