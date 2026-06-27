import { Injectable } from '@nestjs/common';
import {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './image-generation-provider.interface';

/** Minimal valid 1x1 PNG (transparent). */
const MOCK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

@Injectable()
export class MockImageGenerationProvider implements ImageGenerationProvider {
  async generate(
    _request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    return {
      imageBuffer: Buffer.from(MOCK_PNG_BASE64, 'base64'),
      mimeType: 'image/png',
      model: 'mock-image',
    };
  }
}
