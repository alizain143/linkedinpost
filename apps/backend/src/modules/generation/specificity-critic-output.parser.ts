import { Injectable } from '@nestjs/common';
import { generationParseError } from './generation.errors';
import {
  isQuickDraftVariantFormat,
  QUICK_DRAFT_VARIANT_FORMATS,
  type QuickDraftVariantFormat,
} from './quick-draft-format';

export interface SpecificityCriticVariantScore {
  format: QuickDraftVariantFormat;
  specificity: number;
  genericness: number;
  padding: number;
  passed: boolean;
  formatOk: boolean;
}

export interface SpecificityCriticResult {
  overall: number;
  passed: boolean;
  variants: SpecificityCriticVariantScore[];
  hints: string[];
}

@Injectable()
export class SpecificityCriticOutputParser {
  parse(raw: string): SpecificityCriticResult {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw generationParseError('Specificity critic response is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError(
        'Specificity critic response must be a JSON object',
      );
    }

    const obj = parsed as Record<string, unknown>;
    const overall = this.requireNumber(obj.overall, 'overall');
    const passed = this.requireBoolean(obj.passed, 'passed');
    const hints = this.requireStringArray(obj.hints ?? [], 'hints');
    const variantsRaw = obj.variants;

    if (!Array.isArray(variantsRaw) || variantsRaw.length !== 3) {
      throw generationParseError(
        'Specificity critic must return exactly 3 variant scores',
      );
    }

    const variants = variantsRaw.map((variant, index) =>
      this.parseVariantScore(variant, index),
    );

    return { overall, passed, variants, hints };
  }

  private parseVariantScore(
    value: unknown,
    index: number,
  ): SpecificityCriticVariantScore {
    if (!value || typeof value !== 'object') {
      throw generationParseError(
        `variants[${index}] must be an object`,
      );
    }

    const variant = value as Record<string, unknown>;
    const formatRaw = variant.format;
    const format = isQuickDraftVariantFormat(formatRaw)
      ? formatRaw
      : QUICK_DRAFT_VARIANT_FORMATS[index];

    return {
      format,
      specificity: this.requireNumber(
        variant.specificity,
        `variants[${index}].specificity`,
      ),
      genericness: this.requireNumber(
        variant.genericness,
        `variants[${index}].genericness`,
      ),
      padding: this.requireNumber(
        variant.padding,
        `variants[${index}].padding`,
      ),
      passed: this.requireBoolean(variant.passed, `variants[${index}].passed`),
      formatOk: this.requireBoolean(
        variant.formatOk,
        `variants[${index}].formatOk`,
      ),
    };
  }

  private requireNumber(value: unknown, field: string): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw generationParseError(`${field} must be a number`);
    }
    return value;
  }

  private requireBoolean(value: unknown, field: string): boolean {
    if (typeof value !== 'boolean') {
      throw generationParseError(`${field} must be a boolean`);
    }
    return value;
  }

  private requireStringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value)) {
      throw generationParseError(`${field} must be an array`);
    }
    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string') {
        throw generationParseError(`${field}[${i}] must be a string`);
      }
    }
    return value as string[];
  }
}
