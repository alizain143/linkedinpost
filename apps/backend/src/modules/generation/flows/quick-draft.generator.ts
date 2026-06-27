import { Inject, Injectable } from '@nestjs/common';
import { ContextAssembler } from '../context/context-assembler';
import { GenerationFlow } from './generation-flow.interface';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import type { ModelRouter } from '../llm/model-capability.types';
import { PromptRenderer } from '../prompt-renderer';
import { QuickDraftOutputParser } from '../quick-draft-output.parser';
import {
  QuickDraftInput,
  QuickDraftResult,
} from '../generation.types';

@Injectable()
export class QuickDraftGenerator
  implements GenerationFlow<QuickDraftInput, QuickDraftResult>
{
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly outputParser: QuickDraftOutputParser,
  ) {}

  async generate(input: QuickDraftInput): Promise<QuickDraftResult> {
    const context = await this.contextAssembler.assemble(input);
    const messages = this.promptRenderer.renderQuickDraftV1(context);
    const completion = await this.modelRouter
      .text()
      .complete({ messages });
    return this.outputParser.parse(completion.content);
  }
}
