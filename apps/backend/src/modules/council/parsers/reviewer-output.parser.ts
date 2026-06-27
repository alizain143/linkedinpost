import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';

export interface ReviewerOutput {
  overall: number;
  hook: number;
  voice: number;
  clarity: number;
  passed: boolean;
  feedback: string;
  revisionHints: string[];
}

@Injectable()
export class ReviewerOutputParser {
  parse(content: string): ReviewerOutput {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Reviewer output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Reviewer output must be an object');
    }

    const obj = parsed as Record<string, unknown>;

    const overall = this.readScore(obj.overall);
    const hook = this.readScore(obj.hook);
    const voice = this.readScore(obj.voice);
    const clarity = this.readScore(obj.clarity);

    if (typeof obj.feedback !== 'string') {
      throw generationParseError('Reviewer output missing feedback');
    }

    const revisionHints = Array.isArray(obj.revisionHints)
      ? obj.revisionHints.map(String)
      : [];

    const passed =
      typeof obj.passed === 'boolean' ? obj.passed : overall >= 75;

    return {
      overall,
      hook,
      voice,
      clarity,
      passed,
      feedback: obj.feedback,
      revisionHints,
    };
  }

  private readScore(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw generationParseError('Reviewer output missing numeric scores');
    }
    return value;
  }
}
