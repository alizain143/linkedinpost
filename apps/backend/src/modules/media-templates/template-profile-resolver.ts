import type { LinkedInProfileData } from '../linkedin/linkedin.types';

export interface TemplateProfileSourceInput {
  linkedInProfile?: LinkedInProfileData | null;
  contentProfile?: {
    name?: string | null;
    roleTitle?: string | null;
    industry?: string | null;
    brandPrimary?: string | null;
    brandAccent?: string | null;
  } | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  } | null;
  overrides?: {
    profileName?: string;
    roleTitle?: string;
  };
}

export interface ResolvedTemplateProfile {
  profileName: string;
  roleTitle: string;
  currentCompany: string;
  industry: string;
  avatarUrl: string | null;
  brandPrimary?: string | null;
  brandAccent?: string | null;
}

function pickLinkedInTitle(
  profile?: LinkedInProfileData | null,
): string | null {
  if (!profile) return null;

  const direct = profile.currentTitle?.trim();
  if (direct) return direct;

  const currentPosition = profile.positions.find((position) => position.isCurrent);
  const fromCurrent = currentPosition?.title?.trim();
  if (fromCurrent) return fromCurrent;

  return profile.positions[0]?.title?.trim() || null;
}

function pickLinkedInCompany(
  profile?: LinkedInProfileData | null,
): string | null {
  if (!profile) return null;

  const direct = profile.currentCompany?.trim();
  if (direct) return direct;

  const currentPosition = profile.positions.find((position) => position.isCurrent);
  const fromCurrent = currentPosition?.companyName?.trim();
  if (fromCurrent) return fromCurrent;

  return profile.positions[0]?.companyName?.trim() || null;
}

export function resolveTemplateProfile(
  input: TemplateProfileSourceInput,
): ResolvedTemplateProfile {
  const clerkName = [input.user?.firstName, input.user?.lastName]
    .filter(Boolean)
    .join(' ');

  const profileName =
    input.overrides?.profileName?.trim() ||
    input.linkedInProfile?.fullName?.trim() ||
    input.contentProfile?.name?.trim() ||
    clerkName ||
    'Your Name';

  const roleTitle =
    input.overrides?.roleTitle?.trim() ||
    pickLinkedInTitle(input.linkedInProfile) ||
    input.contentProfile?.roleTitle?.trim() ||
    'Your Title';

  const currentCompany = pickLinkedInCompany(input.linkedInProfile) ?? '';

  const avatarUrl =
    input.linkedInProfile?.pictureUrl?.trim() ||
    input.user?.profileImageUrl?.trim() ||
    null;

  return {
    profileName,
    roleTitle,
    currentCompany,
    industry: input.contentProfile?.industry?.trim() ?? '',
    avatarUrl,
    brandPrimary: input.contentProfile?.brandPrimary,
    brandAccent: input.contentProfile?.brandAccent,
  };
}
