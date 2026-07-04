import { Injectable } from '@nestjs/common';
import { generationParseError } from './generation.errors';

@Injectable()
export class ComparePickOutputParser {
  parse(
    raw: string,
    optionCount: number,
  ): { recommendedIndex: number; reason: string } {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw generationParseError('LLM response is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('LLM response must be a JSON object');
    }

    const obj = parsed as Record<string, unknown>;
    const index = obj.recommendedIndex;

    if (
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= optionCount
    ) {
      throw generationParseError(
        `recommendedIndex must be an integer between 0 and ${optionCount - 1}`,
      );
    }

    const reason =
      typeof obj.reason === 'string' ? obj.reason.trim() : '';

    if (!reason) {
      throw generationParseError('reason must be a non-empty string');
    }

    return {
      recommendedIndex: index,
      reason: reason.slice(0, 280),
    };
  }
}
