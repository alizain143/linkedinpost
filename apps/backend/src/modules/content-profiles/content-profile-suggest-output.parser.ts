import { Injectable } from '@nestjs/common';
import { ContentGoal } from '@prisma/client';
import { generationParseError } from '../generation/generation.errors';
import { CONTENT_GOALS } from './prompts/content-profile-suggest.v1';

export interface SuggestedContentProfile {
  name: string;
  roleTitle?: string;
  industry?: string;
  targetAudience?: string;
  contentGoal?: ContentGoal;
  preferredTone?: string;
  brandPrimary?: string;
  brandAccent?: string;
  offerDescription?: string;
  writingSample?: string;
  avoidWords?: string;
  isDefault?: boolean;
  pillars: string[];
}

@Injectable()
export class ContentProfileSuggestOutputParser {
  parse(raw: string): { profiles: SuggestedContentProfile[] } {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw generationParseError('LLM response is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('LLM response must be a JSON object');
    }

    const profiles = (parsed as { profiles?: unknown }).profiles;

    if (!Array.isArray(profiles) || profiles.length !== 3) {
      throw generationParseError(
        'LLM response must contain exactly 3 profiles',
      );
    }

    return {
      profiles: profiles.map((profile, index) =>
        this.parseProfile(profile, index),
      ),
    };
  }

  private parseProfile(value: unknown, index: number): SuggestedContentProfile {
    if (!value || typeof value !== 'object') {
      throw generationParseError(`Profile at index ${index} must be an object`);
    }

    const profile = value as Record<string, unknown>;
    const name = this.requireString(profile.name, `profiles[${index}].name`);
    const pillars = this.requirePillars(profile.pillars, index);

    return {
      name,
      roleTitle: this.optionalString(profile.roleTitle),
      industry: this.optionalString(profile.industry),
      targetAudience: this.optionalString(profile.targetAudience),
      contentGoal: this.optionalContentGoal(profile.contentGoal, index),
      preferredTone: this.optionalString(profile.preferredTone),
      brandPrimary: this.optionalString(profile.brandPrimary),
      brandAccent: this.optionalString(profile.brandAccent),
      offerDescription: this.optionalString(profile.offerDescription),
      writingSample: this.optionalString(profile.writingSample),
      avoidWords: this.optionalString(profile.avoidWords),
      isDefault:
        typeof profile.isDefault === 'boolean' ? profile.isDefault : undefined,
      pillars,
    };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw generationParseError(`${field} must be a non-empty string`);
    }

    return value.trim();
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private optionalContentGoal(
    value: unknown,
    index: number,
  ): ContentGoal | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string' || !CONTENT_GOALS.has(value)) {
      throw generationParseError(
        `profiles[${index}].contentGoal must be a valid content goal`,
      );
    }

    return value as ContentGoal;
  }

  private requirePillars(value: unknown, index: number): string[] {
    if (!Array.isArray(value) || value.length < 3 || value.length > 5) {
      throw generationParseError(
        `profiles[${index}].pillars must contain 3 to 5 items`,
      );
    }

    return value.map((pillar, pillarIndex) => {
      if (typeof pillar !== 'string' || pillar.trim().length === 0) {
        throw generationParseError(
          `profiles[${index}].pillars[${pillarIndex}] must be a non-empty string`,
        );
      }

      return pillar.trim();
    });
  }
}
