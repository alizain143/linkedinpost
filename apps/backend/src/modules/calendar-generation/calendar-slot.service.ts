import { Injectable } from '@nestjs/common';
import { QuickDraftGenerator } from '../generation/flows/quick-draft.generator';
import {
  QuickDraftInput,
  QuickDraftVariant,
} from '../generation/generation.types';
import { CalendarPlannerSlot } from './parsers/calendar-planner-output.parser';

@Injectable()
export class CalendarSlotService {
  constructor(private readonly quickDraftGenerator: QuickDraftGenerator) {}

  async generateVariant(
    input: QuickDraftInput,
    slot: CalendarPlannerSlot,
  ): Promise<QuickDraftVariant> {
    const result = await this.quickDraftGenerator.generate({
      ...input,
      topic: slot.topic,
      postType: slot.postType,
      tone: slot.tone || input.tone,
      pillar: slot.pillar || input.pillar,
    });

    if (!result.variants.length) {
      throw new Error('Quick draft returned no variants for calendar slot');
    }

    return result.variants[0];
  }
}
