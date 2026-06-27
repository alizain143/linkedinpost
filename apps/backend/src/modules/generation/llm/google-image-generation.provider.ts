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
      const response = await client.models.generateContent({
        model,
        contents: this.buildPrompt(request),
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

  private buildPrompt(request: ImageGenerationRequest): string {
    const width = request.width ?? POST_MEDIA_DEFAULT_WIDTH;
    const height = request.height ?? POST_MEDIA_DEFAULT_HEIGHT;

    return `${request.prompt}\n\nDimensions: ${width}x${height}px quote card for LinkedIn.`;
  }
}
