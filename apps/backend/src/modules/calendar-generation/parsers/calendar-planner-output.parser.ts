import { Injectable } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { generationParseError } from '../../generation/generation.errors';

export interface CalendarPlannerSlot {
  date: string;
  topic: string;
  pillar: string;
  postType: PostType;
  tone: string;
}

export interface CalendarPlannerOutput {
  slots: CalendarPlannerSlot[];
}

const POST_TYPES = new Set<string>(Object.values(PostType));

@Injectable()
export class CalendarPlannerOutputParser {
  parse(content: string, expectedDates: string[]): CalendarPlannerOutput {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Calendar planner output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Calendar planner output must be an object');
    }

    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj.slots)) {
      throw generationParseError('Calendar planner output requires slots array');
    }

    if (obj.slots.length !== expectedDates.length) {
      throw generationParseError(
        `Calendar planner must return ${expectedDates.length} slots`,
      );
    }

    const slots = obj.slots.map((slot, index) => {
      if (!slot || typeof slot !== 'object') {
        throw generationParseError('Each calendar slot must be an object');
      }

      const item = slot as Record<string, unknown>;
      const postType = String(item.postType ?? 'personal_story');

      if (!POST_TYPES.has(postType)) {
        throw generationParseError(`Invalid postType: ${postType}`);
      }

      return {
        date: String(item.date ?? expectedDates[index]),
        topic: String(item.topic ?? '').trim(),
        pillar: String(item.pillar ?? '').trim(),
        postType: postType as PostType,
        tone: String(item.tone ?? '').trim(),
      };
    });

    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].topic) {
        throw generationParseError(`Slot ${i + 1} is missing topic`);
      }
      slots[i].date = expectedDates[i];
    }

    return { slots };
  }
}
