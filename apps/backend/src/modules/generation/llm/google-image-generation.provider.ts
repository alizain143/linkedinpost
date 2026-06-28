import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Modality } from '@google/genai';
import {
  POST_MEDIA_DEFAULT_HEIGHT,
  POST_MEDIA_DEFAULT_WIDTH,
} from '../../../common/constants/media.constants';
import { llmProviderError } from '../generation.errors';
import { GoogleGenAIClientFactory } from './google-genai.client';
import { extractImageFromGenerateContentResponse } from './google-image-response.util';
import {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './image-generation-provider.interface';

@Injectable()
export class GoogleImageGenerationProvider implements ImageGenerationProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly googleGenAIClientFactory: GoogleGenAIClientFactory,
  ) {}

  async generate(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const model =
      this.configService.get<string>('google.imageModel') ??
      'gemini-3.1-flash-image';

    try {
      const client = this.googleGenAIClientFactory.createClient();
      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      for (const reference of request.referenceImages ?? []) {
        parts.push({
          inlineData: {
            mimeType: reference.mimeType,
            data: reference.buffer.toString('base64'),
          },
        });
      }

      parts.push({ text: this.buildPromptText(request) });

      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const image = extractImageFromGenerateContentResponse(response);
      if (!image) {
        throw llmProviderError(
          'Google image generation returned no supported image output',
        );
      }

      return {
        imageBuffer: image.buffer,
        mimeType: image.mimeType,
        model,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Google image generation failed';
      throw llmProviderError(message);
    }
  }

  private buildPromptText(request: ImageGenerationRequest): string {
    const width = request.width ?? POST_MEDIA_DEFAULT_WIDTH;
    const height = request.height ?? POST_MEDIA_DEFAULT_HEIGHT;
    const headline = request.headlineText?.trim();
    const style = request.styleNotes?.trim();
    const visual = request.prompt.trim();
    const hasReferences = (request.referenceImages?.length ?? 0) > 0;

    const lines = [
      `LinkedIn feed image, ${width}x${height}px, landscape.`,
    ];

    if (hasReferences) {
      lines.push(
        'Use the attached reference images for mood, composition, and color inspiration only. Create an original image.',
      );
    }

    if (headline) {
      lines.push(`Headline (render exactly): "${headline}"`);
    }

    lines.push(`Visual: ${visual}`);

    if (style) {
      lines.push(`Style: ${style}`);
    }

    lines.push(
      'Rules: professional LinkedIn quality, no logos, no watermarks, no stock photo clichés.',
    );

    return lines.join('\n');
  }
}
