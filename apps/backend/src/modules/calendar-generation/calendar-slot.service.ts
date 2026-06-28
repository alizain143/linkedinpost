import { Injectable } from '@nestjs/common';
import { CalendarSlotGenerator } from '../generation/flows/calendar-slot.generator';
import {
  QuickDraftInput,
  QuickDraftVariant,
} from '../generation/generation.types';
import { CalendarPlannerSlot } from './parsers/calendar-planner-output.parser';

@Injectable()
export class CalendarSlotService {
  constructor(private readonly calendarSlotGenerator: CalendarSlotGenerator) {}

  async generateVariant(
    input: QuickDraftInput,
    slot: CalendarPlannerSlot,
  ): Promise<QuickDraftVariant> {
    const result = await this.calendarSlotGenerator.generate({
      ...input,
      topic: slot.topic,
      postType: slot.postType,
      tone: slot.tone || input.tone,
      pillar: slot.pillar || input.pillar,
    });

    return result.variant;
  }
}
