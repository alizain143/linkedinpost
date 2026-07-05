import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CouncilAgentRole } from '@prisma/client';
import { Modality } from '@google/genai';
import { ContextAssembler } from '../generation/context/context-assembler';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { COUNCIL_MEDIA_REVIEWER_CAROUSEL_V1_SYSTEM } from '../generation/prompts/council-media-reviewer-carousel.v1.system';
import { GoogleGenAIClientFactory } from '../generation/llm/google-genai.client';
import { PromptRenderer } from '../generation/prompt-renderer';
import { CouncilAgentService } from './council-agent.service';
import { MediaReviewerOutputParser } from './parsers/media-reviewer-output.parser';

export type CarouselSlideReviewInput = {
  imageBuffer: Buffer;
  mimeType: string;
  sortOrder: number;
  altText?: string;
};

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

  async reviewCarousel(
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    slides: CarouselSlideReviewInput[],
  ) {
    const apiKey = this.configService.get<string>('google.apiKey');
    if (!apiKey || slides.length === 0) {
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

      const ordered = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> =
        [
          { text: COUNCIL_MEDIA_REVIEWER_CAROUSEL_V1_SYSTEM },
          { text: `${messages[0].content}\n\n${messages[1].content}` },
        ];

      for (const slide of ordered) {
        parts.push({
          text: `--- Slide ${slide.sortOrder + 1} of ${ordered.length}${slide.altText ? ` (${slide.altText})` : ''} ---`,
        });
        parts.push({
          inlineData: {
            mimeType: slide.mimeType,
            data: slide.imageBuffer.toString('base64'),
          },
        });
      }

      parts.push({
        text: 'Review all carousel slides above as one set. Return JSON only.',
      });

      const client = this.googleGenAIClientFactory.createClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts }],
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
        model: 'gemini-2.0-flash-vision-carousel',
      };
    } catch (error) {
      this.logger.warn(
        'Carousel vision media review failed, falling back to spec review',
        error,
      );
      return this.councilAgentService.runMediaReviewer(input, priorSteps);
    }
  }
}
