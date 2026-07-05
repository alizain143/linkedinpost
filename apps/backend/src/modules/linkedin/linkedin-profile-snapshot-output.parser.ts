import { BadRequestException, Injectable } from '@nestjs/common';

export type ExtractedLinkedInProfile = {
  profileUrl: string;
  headline: string | null;
  summary: string | null;
  positions: Array<{
    title: string | null;
    companyName: string | null;
    description: string | null;
    isCurrent: boolean;
  }>;
  education: Array<{
    schoolName: string | null;
    degreeName: string | null;
  }>;
  skills: string[];
};

const PLACEHOLDER_PATTERNS = [
  /^school$/i,
  /^degree,?\s*field of study$/i,
  /^add education$/i,
  /recruiter inmail/i,
  /^show your qualifications/i,
];

@Injectable()
export class LinkedInProfileSnapshotOutputParser {
  parse(raw: string, profileUrl: string): ExtractedLinkedInProfile {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException({
        error: 'Could not parse profile extraction response',
        code: 'LINKEDIN_EXTRACT_PARSE_ERROR',
      });
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new BadRequestException({
        error: 'Profile extraction response must be a JSON object',
        code: 'LINKEDIN_EXTRACT_PARSE_ERROR',
      });
    }

    const obj = parsed as Record<string, unknown>;

    return {
      profileUrl,
      headline: this.optionalString(obj.headline),
      summary: this.optionalString(obj.summary),
      positions: this.parsePositions(obj.positions),
      education: this.parseEducation(obj.education),
      skills: this.parseSkills(obj.skills),
    };
  }

  private parsePositions(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const title = this.optionalString(row.title);
        if (!title || this.isPlaceholder(title)) return null;

        return {
          title,
          companyName: this.optionalString(row.companyName),
          description: this.optionalString(row.description),
          isCurrent:
            typeof row.isCurrent === 'boolean' ? row.isCurrent : index === 0,
        };
      })
      .filter(Boolean) as ExtractedLinkedInProfile['positions'];
  }

  private parseEducation(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const schoolName = this.optionalString(row.schoolName);
        if (!schoolName || this.isPlaceholder(schoolName)) return null;

        const degreeName = this.optionalString(row.degreeName);
        return {
          schoolName,
          degreeName: degreeName && !this.isPlaceholder(degreeName) ? degreeName : null,
        };
      })
      .filter(Boolean) as ExtractedLinkedInProfile['education'];
  }

  private parseSkills(value: unknown) {
    if (!Array.isArray(value)) return [];

    const skills: string[] = [];
    const seen = new Set<string>();

    for (const item of value) {
      if (typeof item !== 'string') continue;
      const name = item.trim();
      if (!name || this.isPlaceholder(name) || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      skills.push(name);
    }

    return skills.slice(0, 30);
  }

  private optionalString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private isPlaceholder(value: string) {
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
  }
}
