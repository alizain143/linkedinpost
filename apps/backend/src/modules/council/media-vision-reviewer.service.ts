import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CouncilAgentRole } from '@prisma/client';
import { Modality } from '@google/genai';
import { ContextAssembler } from '../generation/context/context-assembler';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { GoogleGenAIClientFactory } from '../generation/llm/google-genai.client';
import { PromptRenderer } from '../generation/prompt-renderer';
import { CouncilAgentService } from './council-agent.service';
import { MediaReviewerOutputParser } from './parsers/media-reviewer-output.parser';

@Injectable()
export class MediaVisionReviewerService {
  private readonly logger = new Logger(MediaVisionReviewerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly googleGenAIClientFactory: GoogleGenAIClientFactory,
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    private readonly mediaReviewerParser: MediaReviewerOutputParser,
    private readonly councilAgentService: CouncilAgentService,
  ) {}

  async review(
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    imageBuffer: Buffer,
    mimeType: string,
  ) {
    const apiKey = this.configService.get<string>('google.apiKey');
    if (!apiKey) {
      return this.councilAgentService.runMediaReviewer(input, priorSteps);
    }

    try {
      const baseContext = await this.contextAssembler.assemble(input);
      const messages = this.promptRenderer.renderFlow(
        'council-media-reviewer',
        1,
        {
          ...baseContext,
          priorSteps,
          promptAgentRole: CouncilAgentRole.media_reviewer,
        },
        { agentRole: CouncilAgentRole.media_reviewer },
      );

      const client = this.googleGenAIClientFactory.createClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBuffer.toString('base64'),
                },
              },
              {
                text: `${messages[0].content}\n\n${messages[1].content}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.TEXT],
        },
      });

      const text =
        response.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('') ?? '';

      const parsed = this.mediaReviewerParser.parse(text);
      return {
        output: parsed,
        model: 'gemini-2.0-flash-vision',
      };
    } catch (error) {
      this.logger.warn(
        'Vision media review failed, falling back to spec review',
        error,
      );
      return this.councilAgentService.runMediaReviewer(input, priorSteps);
    }
  }
}
