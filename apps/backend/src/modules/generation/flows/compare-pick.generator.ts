import { Inject, Injectable } from '@nestjs/common';
import { ContextAssembler } from '../context/context-assembler';
import { ComparePickOutputParser } from '../compare-pick-output.parser';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import type { ModelRouter } from '../llm/model-capability.types';
import { PromptRenderer } from '../prompt-renderer';
import {
  ComparePickInput,
  ComparePickResult,
  QuickDraftVariant,
} from '../generation.types';

function formatOptions(variants: QuickDraftVariant[]): string {
  return variants
    .map((variant, index) => {
      const tags =
        variant.tags?.length > 0 ? variant.tags.join(', ') : '(none)';
      return [
        `### Option ${index}`,
        `hook: ${variant.hook}`,
        `body: ${variant.body}`,
        `cta: ${variant.cta}`,
        `tags: ${tags}`,
      ].join('\n');
    })
    .join('\n\n');
}

@Injectable()
export class ComparePickGenerator {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly outputParser: ComparePickOutputParser,
  ) {}

  async generate(input: ComparePickInput): Promise<ComparePickResult> {
    const context = await this.contextAssembler.assemble({
      workspaceId: input.workspaceId,
      userId: input.userId,
      contentProfileId: input.contentProfileId,
      topic: input.topic,
    });

    const messages = this.promptRenderer.renderComparePickV1(
      context,
      formatOptions(input.variants),
    );
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });
    const parsed = this.outputParser.parse(
      completion.content,
      input.variants.length,
    );

    return {
      ...parsed,
      promptId: 'compare-pick',
      promptVersion: 'v1',
      model: completion.model,
      usage: completion.usage,
    };
  }
}
