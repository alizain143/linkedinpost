import { Injectable } from '@nestjs/common';
import { ContextProvider } from './context-provider.interface';
import {
  GenerationContext,
  GenerationContextSlice,
  QuickDraftInput,
} from '../generation.types';

@Injectable()
export class GenerationInputContextProvider implements ContextProvider {
  readonly order = 30;

  async provide(
    input: QuickDraftInput,
    _accumulated: GenerationContext,
  ): Promise<GenerationContextSlice> {
    const slice: GenerationContextSlice = {
      input: {},
    };

    if (input.topic !== undefined) {
      slice.input!.topic = input.topic;
    }
    if (input.postType !== undefined) {
      slice.input!.postType = input.postType;
    }
    if (input.tone !== undefined) {
      slice.input!.tone = input.tone;
    }
    if (input.pillar !== undefined) {
      slice.input!.pillar = input.pillar;
    }
    if (input.additionalContext !== undefined) {
      slice.input!.additionalContext = input.additionalContext;
    }
    if (input.mediaCustomPrompt !== undefined) {
      slice.input!.mediaCustomPrompt = input.mediaCustomPrompt;
    }
    if (input.revisionPrompt !== undefined) {
      slice.input!.revisionPrompt = input.revisionPrompt;
    }
    if (input.approvalFeedback !== undefined) {
      slice.input!.approvalFeedback = input.approvalFeedback;
    }
    if (input.previousVariant) {
      slice.input!.previousHook = input.previousVariant.hook;
      slice.input!.previousBody = input.previousVariant.body;
      slice.input!.previousCta = input.previousVariant.cta;
      slice.input!.previousTags = input.previousVariant.tags;
    }
    if (input.avoidVariants?.length) {
      slice.input!.avoidVariants = input.avoidVariants;
    }
    if ('brief' in input && input.brief !== undefined) {
      slice.input!.brief = input.brief as string;
    }

    if (Object.keys(slice.input!).length === 0) {
      return {};
    }

    return slice;
  }
}
