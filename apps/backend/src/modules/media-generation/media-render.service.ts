import { Inject, Injectable } from '@nestjs/common';
import type { MediaCreatorOutput } from '../council/parsers/media-creator-output.parser';
import type {
  CouncilInput,
  GenerationContentProfileContext,
} from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';

export interface MediaRenderResult {
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
}

@Injectable()
export class MediaRenderService {
  constructor(@Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter) {}

  async renderMedia(
    spec: MediaCreatorOutput,
    input: CouncilInput,
    profile?: GenerationContentProfileContext,
  ): Promise<MediaRenderResult> {
    const promptParts: string[] = [];

    const brandPrimary = profile?.brandPrimary?.trim();
    const brandAccent = profile?.brandAccent?.trim();
    if (brandPrimary || brandAccent) {
      const colors = [
        brandPrimary ? `primary ${brandPrimary}` : null,
        brandAccent ? `accent ${brandAccent}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      promptParts.push(`Brand color theme: ${colors}.`);
    }

    promptParts.push(spec.imagePrompt);

    const customPrompt = input.mediaCustomPrompt?.trim();
    if (customPrompt) {
      promptParts.push(`User direction: ${customPrompt}`);
    }

    const imageResult = await this.modelRouter.image().generate({
      prompt: promptParts.join('\n'),
      width: spec.width,
      height: spec.height,
      styleNotes: spec.styleNotes,
    });

    return {
      imageBuffer: imageResult.imageBuffer,
      mimeType: imageResult.mimeType,
      imageModel: imageResult.model,
    };
  }
}
