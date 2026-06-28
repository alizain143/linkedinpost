import { Inject, Injectable } from '@nestjs/common';
import { CouncilAgentRole } from '@prisma/client';
import { ContextAssembler } from '../context/context-assembler';
import { GenerationFlow } from './generation-flow.interface';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import type { ModelRouter } from '../llm/model-capability.types';
import { PromptRenderer } from '../prompt-renderer';
import { QuickDraftSingleOutputParser } from '../quick-draft-single-output.parser';
import { QuickDraftInput, QuickDraftVariant } from '../generation.types';

export interface CalendarSlotResult {
  variant: QuickDraftVariant;
  promptId: string;
  promptVersion: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

@Injectable()
export class CalendarSlotGenerator implements GenerationFlow<
  QuickDraftInput,
  CalendarSlotResult
> {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    private readonly outputParser: QuickDraftSingleOutputParser,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  async generate(input: QuickDraftInput): Promise<CalendarSlotResult> {
    const context = await this.contextAssembler.assemble(input);
    const messages = this.promptRenderer.renderQuickDraftSingleV1(context);
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });
    const parsed = this.outputParser.parse(completion.content);

    return {
      variant: parsed,
      promptId: 'quick-draft-single',
      promptVersion: 'v1',
      model: completion.model,
      usage: completion.usage,
    };
  }
}
