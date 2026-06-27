import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';

export interface MediaReviewerOutput {
  passed: boolean;
  issues: string[];
  score: number;
}

@Injectable()
export class MediaReviewerOutputParser {
  parse(content: string): MediaReviewerOutput {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Media reviewer output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Media reviewer output must be an object');
    }

    const obj = parsed as Record<string, unknown>;

    return {
      passed: Boolean(obj.passed),
      issues: Array.isArray(obj.issues) ? obj.issues.map(String) : [],
      score: typeof obj.score === 'number' ? obj.score : 0,
    };
  }
}
