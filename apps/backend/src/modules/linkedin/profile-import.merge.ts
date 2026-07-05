import {
  LinkedInEducationSummary,
  LinkedInEnrichmentSource,
  LinkedInEnrichmentStatus,
  LinkedInPositionSummary,
  LinkedInProfileData,
} from './linkedin.types';

export interface ProfileImportPayload {
  profileUrl: string;
  headline?: string | null;
  summary?: string | null;
  positions?: LinkedInPositionSummary[];
  education?: LinkedInEducationSummary[];
}

export function defaultEnrichmentFields(): Pick<
  LinkedInProfileData,
  'enrichmentStatus' | 'enrichmentSource' | 'enrichedAt' | 'importedFields'
> {
  return {
    enrichmentStatus: 'none',
    enrichmentSource: 'api_only',
    enrichedAt: null,
    importedFields: [],
  };
}

export function withApiOnlyEnrichment(
  profile: Omit<
    LinkedInProfileData,
    'enrichmentStatus' | 'enrichmentSource' | 'enrichedAt' | 'importedFields'
  >,
): LinkedInProfileData {
  return {
    ...profile,
    ...defaultEnrichmentFields(),
    enrichmentSource: 'api_only',
  };
}

/** OAuth fields win for identity; import fills rich profile sections. */
export function mergeImportedProfile(
  existing: LinkedInProfileData | null,
  memberId: string,
  importData: ProfileImportPayload,
): { profile: LinkedInProfileData; importedFields: string[] } {
  const base: LinkedInProfileData = existing ?? {
    memberId,
    fullName: null,
    firstName: null,
    lastName: null,
    email: null,
    pictureUrl: null,
    headline: null,
    summary: null,
    currentTitle: null,
    currentCompany: null,
    profileUrl: null,
    locale: null,
    positions: [],
    education: [],
    syncedAt: new Date().toISOString(),
    ...defaultEnrichmentFields(),
  };

  const importedFields: string[] = [];
  const now = new Date().toISOString();

  const headline =
    importData.headline?.trim() || base.headline;
  if (importData.headline?.trim()) importedFields.push('headline');

  const summary =
    importData.summary?.trim() || base.summary;
  if (importData.summary?.trim()) importedFields.push('summary');

  const positions =
    importData.positions && importData.positions.length > 0
      ? importData.positions
      : base.positions;
  if (importData.positions && importData.positions.length > 0) {
    importedFields.push('positions');
  }

  const education =
    importData.education && importData.education.length > 0
      ? importData.education
      : base.education;
  if (importData.education && importData.education.length > 0) {
    importedFields.push('education');
  }

  const profileUrl = importData.profileUrl.trim() || base.profileUrl;
  if (importData.profileUrl.trim()) importedFields.push('profileUrl');

  const currentFromImport = positions.find((p) => p.isCurrent) ?? positions[0];

  return {
    importedFields,
    profile: {
      memberId: base.memberId || memberId,
      fullName: base.fullName,
      firstName: base.firstName,
      lastName: base.lastName,
      email: base.email,
      pictureUrl: base.pictureUrl,
      headline,
      summary,
      // Keep OAuth/sync title & company for template chrome (e.g. static brand footer).
      currentTitle: base.currentTitle ?? currentFromImport?.title ?? null,
      currentCompany: base.currentCompany ?? currentFromImport?.companyName ?? null,
      profileUrl,
      locale: base.locale,
      positions,
      education,
      syncedAt: base.syncedAt,
      enrichmentStatus: 'complete' satisfies LinkedInEnrichmentStatus,
      enrichmentSource: 'user_import' satisfies LinkedInEnrichmentSource,
      enrichedAt: now,
      importedFields,
    },
  };
}

/** After OAuth API sync, keep user-imported rich fields. */
export function mergeApiSyncPreservingImport(
  existing: LinkedInProfileData | null,
  apiProfile: LinkedInProfileData,
): LinkedInProfileData {
  if (
    !existing ||
    existing.enrichmentSource !== 'user_import' ||
    existing.enrichmentStatus !== 'complete'
  ) {
    return apiProfile;
  }

  return {
    ...apiProfile,
    headline: existing.headline ?? apiProfile.headline,
    summary: existing.summary ?? apiProfile.summary,
    positions:
      existing.positions.length > apiProfile.positions.length
        ? existing.positions
        : apiProfile.positions,
    education:
      existing.education.length > apiProfile.education.length
        ? existing.education
        : apiProfile.education,
    profileUrl: apiProfile.profileUrl ?? existing.profileUrl,
    currentTitle: existing.currentTitle ?? apiProfile.currentTitle,
    currentCompany: existing.currentCompany ?? apiProfile.currentCompany,
    enrichmentStatus: existing.enrichmentStatus,
    enrichmentSource: existing.enrichmentSource,
    enrichedAt: existing.enrichedAt,
    importedFields: existing.importedFields,
  };
}

/** Parse free-text experience lines like "Founder at Acme" into position summaries. */
export function parseExperienceText(text: string): LinkedInPositionSummary[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const atMatch = line.match(/^(.+?)\s+at\s+(.+)$/i);
      if (atMatch) {
        return {
          title: atMatch[1].trim(),
          companyName: atMatch[2].trim(),
          companyPageUrl: null,
          startedOn: null,
          isCurrent: index === 0,
        };
      }

      const dashMatch = line.match(/^(.+?)\s+[—–-]\s+(.+)$/);
      if (dashMatch) {
        return {
          title: dashMatch[1].trim(),
          companyName: dashMatch[2].trim(),
          companyPageUrl: null,
          startedOn: null,
          isCurrent: index === 0,
        };
      }

      return {
        title: line,
        companyName: null,
        companyPageUrl: null,
        startedOn: null,
        isCurrent: index === 0,
      };
    });
}
