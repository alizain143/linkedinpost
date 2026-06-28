import { Injectable } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { generationParseError } from './generation.errors';
import { QuickDraftVariant } from './generation.types';

const POST_TYPES = new Set<string>(Object.values(PostType));

@Injectable()
export class QuickDraftSingleOutputParser {
  parse(raw: string): QuickDraftVariant {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw generationParseError('LLM response is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('LLM response must be a JSON object');
    }

    return this.parseVariant(parsed as Record<string, unknown>);
  }

  private parseVariant(variant: Record<string, unknown>): QuickDraftVariant {
    const hook = this.requireString(variant.hook, 'hook');
    const body = this.requireString(variant.body, 'body');
    const cta = this.requireString(variant.cta, 'cta');
    const tone = this.requireString(variant.tone, 'tone');
    const pillar = this.requireString(variant.pillar, 'pillar');
    const postType = this.requirePostType(variant.postType, 'postType');
    const tags = this.requireStringArray(variant.tags, 'tags');

    return { hook, body, cta, tags, postType, tone, pillar };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw generationParseError(`${field} must be a non-empty string`);
    }

    return value;
  }

  private requirePostType(value: unknown, field: string): PostType {
    if (typeof value !== 'string' || !POST_TYPES.has(value)) {
      throw generationParseError(`${field} must be a valid post type`);
    }

    return value as PostType;
  }

  private requireStringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value)) {
      throw generationParseError(`${field} must be an array`);
    }

    for (let index = 0; index < value.length; index += 1) {
      if (typeof value[index] !== 'string') {
        throw generationParseError(`${field}[${index}] must be a string`);
      }
    }

    return value as string[];
  }
}
