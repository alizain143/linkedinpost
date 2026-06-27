import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';

export interface WriterOutput {
  hook: string;
  body: string;
  cta: string;
  tags: string[];
  rationale?: string;
}

@Injectable()
export class WriterOutputParser {
  parse(content: string): WriterOutput {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Writer output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Writer output must be an object');
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.hook !== 'string' || !obj.hook.trim()) {
      throw generationParseError('Writer output missing hook');
    }
    if (typeof obj.body !== 'string' || !obj.body.trim()) {
      throw generationParseError('Writer output missing body');
    }
    if (typeof obj.cta !== 'string') {
      throw generationParseError('Writer output missing cta');
    }
    if (!Array.isArray(obj.tags)) {
      throw generationParseError('Writer output missing tags array');
    }

    return {
      hook: obj.hook,
      body: obj.body,
      cta: obj.cta,
      tags: obj.tags.map(String),
      rationale: typeof obj.rationale === 'string' ? obj.rationale : undefined,
    };
  }
}
