import { Inject, Injectable } from '@nestjs/common';
import { PostMediaType } from '@prisma/client';
import { shouldUseTemplateRenderer } from './media-template-catalog';
import { MediaCreatorOutput } from '../council/parsers/media-creator-output.parser';
import { CouncilInput, GenerationContentProfileContext } from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { ImageReferenceDownloaderService } from '../image-scout/image-reference-downloader.service';
import { MediaTemplateService } from './media-template.service';

export interface MediaRenderResult {
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
}

@Injectable()
export class MediaRenderService {
  constructor(
    private readonly mediaTemplateService: MediaTemplateService,
    private readonly referenceDownloader: ImageReferenceDownloaderService,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  async renderMedia(
    spec: MediaCreatorOutput,
    input: CouncilInput,
    profile?: GenerationContentProfileContext,
  ): Promise<MediaRenderResult> {
    if (shouldUseTemplateRenderer(spec.mediaType, input.mediaTemplateId)) {
      const rendered = this.mediaTemplateService.render(spec, {
        profile,
        mediaTemplateId: input.mediaTemplateId,
      });
      return {
        ...rendered,
        imageModel: 'template-renderer',
      };
    }

    const referenceImages =
      input.selectedReferenceUrls && input.selectedReferenceUrls.length > 0
        ? await this.referenceDownloader.downloadReferences(
            input.selectedReferenceUrls,
          )
        : undefined;

    const customPrompt = input.mediaCustomPrompt?.trim();
    const promptParts = [spec.imagePrompt];
    if (customPrompt) {
      promptParts.push(`User direction: ${customPrompt}`);
    }
    if (spec.mediaType === PostMediaType.photo_illustration) {
      promptParts.unshift(
        'Create a professional LinkedIn feed illustration. No text in the image.',
      );
    } else if (spec.mediaType === PostMediaType.infographic) {
      promptParts.unshift(
        'Create a clean LinkedIn infographic visual. Minimal readable text only if essential.',
      );
    }

    const imageResult = await this.modelRouter.image().generate({
      prompt: promptParts.join('\n'),
      width: spec.width,
      height: spec.height,
      headlineText:
        spec.mediaType === PostMediaType.quote_card
          ? spec.headlineText
          : undefined,
      styleNotes: spec.styleNotes,
      referenceImages,
    });

    return {
      imageBuffer: imageResult.imageBuffer,
      mimeType: imageResult.mimeType,
      imageModel: imageResult.model,
    };
  }
}
