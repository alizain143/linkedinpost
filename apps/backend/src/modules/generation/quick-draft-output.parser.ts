import { Injectable } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { generationParseError } from './generation.errors';
import {
  QuickDraftResult,
  QuickDraftVariant,
} from './generation.types';

const POST_TYPES = new Set<string>(Object.values(PostType));

@Injectable()
export class QuickDraftOutputParser {
  parse(raw: string): QuickDraftResult {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw generationParseError('LLM response is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('LLM response must be a JSON object');
    }

    const variants = (parsed as { variants?: unknown }).variants;

    if (!Array.isArray(variants) || variants.length !== 3) {
      throw generationParseError(
        'LLM response must contain exactly 3 variants',
      );
    }

    return {
      variants: variants.map((variant, index) =>
        this.parseVariant(variant, index),
      ),
    };
  }

  private parseVariant(value: unknown, index: number): QuickDraftVariant {
    if (!value || typeof value !== 'object') {
      throw generationParseError(
        `Variant at index ${index} must be an object`,
      );
    }

    const variant = value as Record<string, unknown>;
    const hook = this.requireString(variant.hook, `variants[${index}].hook`);
    const body = this.requireString(variant.body, `variants[${index}].body`);
    const cta = this.requireString(variant.cta, `variants[${index}].cta`);
    const tone = this.requireString(variant.tone, `variants[${index}].tone`);
    const pillar = this.requireString(
      variant.pillar,
      `variants[${index}].pillar`,
    );
    const postType = this.requirePostType(
      variant.postType,
      `variants[${index}].postType`,
    );
    const tags = this.requireStringArray(
      variant.tags,
      `variants[${index}].tags`,
    );

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
      throw generationParseError(
        `${field} must be a valid post type`,
      );
    }

    return value as PostType;
  }

  private requireStringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value)) {
      throw generationParseError(`${field} must be an array`);
    }

    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string') {
        throw generationParseError(
          `${field}[${i}] must be a string`,
        );
      }
    }

    return value as string[];
  }
}
