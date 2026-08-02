import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContextAssembler } from './context/context-assembler';
import { MODEL_ROUTER } from './llm/model-capability.types';
import type { ModelRouter } from './llm/model-capability.types';
import { PromptRenderer } from './prompt-renderer';
import { SpecificityCriticOutputParser } from './specificity-critic-output.parser';
import type {
  QuickDraftInput,
  QuickDraftVariant,
} from './generation.types';
import type { SpecificityCriticResult } from './specificity-critic-output.parser';

@Injectable()
export class SpecificityCriticService {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    private readonly outputParser: SpecificityCriticOutputParser,
    private readonly configService: ConfigService,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  getPassScore(): number {
    return this.configService.get<number>(
      'generation.specificityPassScore',
      70,
    );
  }

  async review(
    input: QuickDraftInput,
    variants: QuickDraftVariant[],
  ): Promise<SpecificityCriticResult> {
    const context = await this.contextAssembler.assemble(input);
    const passScore = this.getPassScore();
    const messages = this.promptRenderer.renderSpecificityCriticV1(
      context,
      variants,
      passScore,
    );

    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });

    const result = this.outputParser.parse(completion.content);

    // Enforce threshold even if model is optimistic
    if (result.overall < passScore) {
      return { ...result, passed: false };
    }

    const anyVariantFailed = result.variants.some((v) => !v.passed || !v.formatOk);
    if (anyVariantFailed) {
      return { ...result, passed: false };
    }

    return result;
  }

  buildRevisionPrompt(result: SpecificityCriticResult): string {
    const hints =
      result.hints.length > 0
        ? result.hints.map((hint, i) => `${i + 1}. ${hint}`).join('\n')
        : 'Rewrite failing variants to be more specific, less padded, and format-correct.';

    return [
      'Specificity critic rejected the draft set. Regenerate all 3 format-locked variants.',
      'Keep the same topic, tone, post type, and pillar constraints from the request.',
      'Fix these issues:',
      hints,
    ].join('\n');
  }
}
