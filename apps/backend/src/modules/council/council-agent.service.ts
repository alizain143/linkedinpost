import { Inject, Injectable } from '@nestjs/common';
import { CouncilAgentRole } from '@prisma/client';
import { ContextAssembler } from '../generation/context/context-assembler';
import {
  CouncilInput,
  CouncilPriorStep,
  GenerationContext,
} from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { PromptRenderer } from '../generation/prompt-renderer';
import { CouncilFlowId } from './council-prompts';
import { EditorOutputParser } from './parsers/editor-output.parser';
import { MediaCreatorOutputParser } from './parsers/media-creator-output.parser';
import { MediaReviewerOutputParser } from './parsers/media-reviewer-output.parser';
import { ReviewerOutputParser } from './parsers/reviewer-output.parser';
import { WriterOutputParser } from './parsers/writer-output.parser';

const FLOW_BY_ROLE: Partial<Record<CouncilAgentRole, CouncilFlowId>> = {
  writer: 'council-writer',
  reviewer: 'council-reviewer',
  editor: 'council-editor',
  media_creator: 'council-media-creator',
  media_reviewer: 'council-media-reviewer',
};

export interface AgentRunOptions {
  passScore?: number;
}

export interface AgentRunResult<T> {
  output: T;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

@Injectable()
export class CouncilAgentService {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly writerParser: WriterOutputParser,
    private readonly reviewerParser: ReviewerOutputParser,
    private readonly editorParser: EditorOutputParser,
    private readonly mediaCreatorParser: MediaCreatorOutputParser,
    private readonly mediaReviewerParser: MediaReviewerOutputParser,
  ) {}

  async runWriter(input: CouncilInput, priorSteps: CouncilPriorStep[]) {
    return this.runAgent(input, priorSteps, 'writer', (content) =>
      this.writerParser.parse(content),
    );
  }

  async runReviewer(
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    options?: AgentRunOptions,
  ) {
    return this.runAgent(
      input,
      priorSteps,
      'reviewer',
      (content) =>
        this.reviewerParser.parse(content, {
          passScore: options?.passScore,
        }),
      options,
    );
  }

  async runEditor(input: CouncilInput, priorSteps: CouncilPriorStep[]) {
    return this.runAgent(input, priorSteps, 'editor', (content) =>
      this.editorParser.parse(content),
    );
  }

  async runMediaCreator(input: CouncilInput, priorSteps: CouncilPriorStep[]) {
    return this.runAgent(
      input,
      priorSteps,
      CouncilAgentRole.media_creator,
      (content) => this.mediaCreatorParser.parse(content),
    );
  }

  async runMediaReviewer(input: CouncilInput, priorSteps: CouncilPriorStep[]) {
    return this.runAgent(input, priorSteps, 'media_reviewer', (content) =>
      this.mediaReviewerParser.parse(content),
    );
  }

  private async runAgent<T>(
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    role: CouncilAgentRole,
    parse: (content: string) => T,
    options?: AgentRunOptions,
  ): Promise<AgentRunResult<T>> {
    const baseContext = await this.contextAssembler.assemble(input);
    const context: GenerationContext = {
      ...baseContext,
      priorSteps,
      promptAgentRole: role,
      councilPassScore: options?.passScore,
    };
    const flowId = FLOW_BY_ROLE[role];
    if (!flowId) {
      throw new Error(`No prompt flow configured for agent role: ${role}`);
    }
    const messages = this.promptRenderer.renderFlow(flowId, 1, context, {
      agentRole: role,
      passScore: options?.passScore,
    });
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });

    return {
      output: parse(completion.content),
      model: completion.model,
      inputTokens: completion.usage?.inputTokens,
      outputTokens: completion.usage?.outputTokens,
    };
  }
}
