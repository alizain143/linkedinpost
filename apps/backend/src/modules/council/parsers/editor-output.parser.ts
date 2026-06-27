import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';

export interface EditorOutput {
  hook: string;
  body: string;
  cta: string;
  tags: string[];
  changelog?: string;
}

@Injectable()
export class EditorOutputParser {
  parse(content: string): EditorOutput {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Editor output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Editor output must be an object');
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.hook !== 'string' || typeof obj.body !== 'string') {
      throw generationParseError('Editor output missing hook or body');
    }
    if (typeof obj.cta !== 'string' || !Array.isArray(obj.tags)) {
      throw generationParseError('Editor output missing cta or tags');
    }

    return {
      hook: obj.hook,
      body: obj.body,
      cta: obj.cta,
      tags: obj.tags.map(String),
      changelog: typeof obj.changelog === 'string' ? obj.changelog : undefined,
    };
  }
}
