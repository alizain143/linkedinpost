import { Injectable } from '@nestjs/common';
import { generationParseError } from './generation.errors';
import { TopicSuggestion } from './generation.types';

@Injectable()
export class TopicSuggestionsOutputParser {
  parse(raw: string): { suggestions: TopicSuggestion[] } {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw generationParseError('LLM response is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('LLM response must be a JSON object');
    }

    const suggestions = (parsed as { suggestions?: unknown }).suggestions;

    if (!Array.isArray(suggestions) || suggestions.length < 5 || suggestions.length > 8) {
      throw generationParseError(
        'LLM response must contain 5 to 8 suggestions',
      );
    }

    return {
      suggestions: suggestions.map((item, index) =>
        this.parseSuggestion(item, index),
      ),
    };
  }

  private parseSuggestion(value: unknown, index: number): TopicSuggestion {
    if (!value || typeof value !== 'object') {
      throw generationParseError(
        `Suggestion at index ${index} must be an object`,
      );
    }

    const item = value as Record<string, unknown>;
    const topic = this.requireString(
      item.topic,
      `suggestions[${index}].topic`,
    );

    if (topic.length > 500) {
      throw generationParseError(
        `suggestions[${index}].topic exceeds max length`,
      );
    }

    const pillar =
      typeof item.pillar === 'string' && item.pillar.trim().length > 0
        ? item.pillar.trim()
        : undefined;

    const rationale =
      typeof item.rationale === 'string' && item.rationale.trim().length > 0
        ? item.rationale.trim()
        : undefined;

    return { topic, pillar, rationale };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw generationParseError(`${field} must be a non-empty string`);
    }

    return value.trim();
  }
}
