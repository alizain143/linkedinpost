import { Inject, Injectable } from '@nestjs/common';
import { ContextAssembler } from '../context/context-assembler';
import { GenerationFlow } from './generation-flow.interface';
import { MODEL_ROUTER } from '../llm/model-capability.types';
import type { ModelRouter } from '../llm/model-capability.types';
import { PromptRenderer } from '../prompt-renderer';
import { QuickDraftOutputParser } from '../quick-draft-output.parser';
import { SpecificityCriticService } from '../specificity-critic.service';
import {
  QuickDraftInput,
  QuickDraftResult,
  QuickDraftVariant,
} from '../generation.types';

@Injectable()
export class QuickDraftGenerator implements GenerationFlow<
  QuickDraftInput,
  QuickDraftResult
> {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly outputParser: QuickDraftOutputParser,
    private readonly specificityCritic: SpecificityCriticService,
  ) {}

  async generate(input: QuickDraftInput): Promise<QuickDraftResult> {
    const first = await this.runDraft(input);
    let variants = first.variants;
    let model = first.model;
    let usage = first.usage;

    try {
      const review = await this.specificityCritic.review(input, variants);
      if (!review.passed) {
        const regen = await this.runDraft({
          ...input,
          revisionPrompt: this.specificityCritic.buildRevisionPrompt(review),
          avoidVariants: variants.map((variant) => ({
            hook: variant.hook,
            body: variant.body,
            cta: variant.cta,
            tags: variant.tags,
          })),
        });
        variants = regen.variants;
        model = regen.model;
        usage = this.mergeUsage(usage, regen.usage);
      }
    } catch {
      // Critic failures should not block returning a draft
    }

    return {
      variants,
      promptId: 'quick-draft',
      promptVersion: 'v4',
      model,
      usage,
    };
  }

  private async runDraft(input: QuickDraftInput): Promise<{
    variants: QuickDraftVariant[];
    model: string;
    usage?: QuickDraftResult['usage'];
  }> {
    const context = await this.contextAssembler.assemble(input);
    const messages = this.promptRenderer.renderQuickDraftV4(context);
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });
    const parsed = this.outputParser.parse(completion.content);

    return {
      variants: parsed.variants,
      model: completion.model,
      usage: completion.usage,
    };
  }

  private mergeUsage(
    a?: QuickDraftResult['usage'],
    b?: QuickDraftResult['usage'],
  ): QuickDraftResult['usage'] | undefined {
    if (!a && !b) return undefined;
    return {
      inputTokens: (a?.inputTokens ?? 0) + (b?.inputTokens ?? 0),
      outputTokens: (a?.outputTokens ?? 0) + (b?.outputTokens ?? 0),
    };
  }
}
