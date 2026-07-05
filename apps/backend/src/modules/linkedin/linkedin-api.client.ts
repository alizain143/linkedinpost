import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LinkedInEducationSummary,
  LinkedInPositionSummary,
  LinkedInProfileData,
  LinkedInPublishResult,
} from './linkedin.types';
import { withApiOnlyEnrichment } from './profile-import.merge';

function pickLocalized(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.localized === 'object' && record.localized) {
    const localized = record.localized as Record<string, string>;
    const first = Object.values(localized)[0];
    return first ?? null;
  }
  return null;
}

@Injectable()
export class LinkedInApiClient {
  constructor(private readonly configService: ConfigService) {}

  private isMock() {
    return this.configService.get<boolean>('linkedin.publishMock', false);
  }

  private apiVersion() {
    return this.configService.get<string>('linkedin.apiVersion', '202601');
  }

  async fetchUserInfo(accessToken: string) {
    if (this.isMock()) {
      return {
        sub: 'mock-member-id',
        name: 'Mock LinkedIn User',
        given_name: 'Mock',
        family_name: 'User',
        email: 'mock@linkedin.example',
        picture: 'https://example.com/avatar.png',
        locale: 'en_US',
      };
    }

    const response = await fetch(
      this.configService.get<string>(
        'linkedin.userinfoUrl',
        'https://api.linkedin.com/v2/userinfo',
      ),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error(`LinkedIn userinfo failed (${response.status})`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  async fetchIdentityMe(
    accessToken: string,
  ): Promise<Record<string, unknown> | null> {
    if (this.isMock()) {
      return {
        basicInfo: {
          profileUrl: 'https://www.linkedin.com/in/mock-user',
        },
        primaryCurrentPosition: {
          title: { localized: { en_US: 'Founder' } },
          companyName: { localized: { en_US: 'linkedinpost.ai' } },
          companyPageUrl: 'https://www.linkedin.com/company/example',
          startedOn: { month: 1, year: 2024 },
        },
        mostRecentEducation: {
          schoolName: { localized: { en_US: 'Example University' } },
          degreeName: { localized: { en_US: 'BS Computer Science' } },
        },
      };
    }

    const response = await fetch(
      this.configService.get<string>(
        'linkedin.identityMeUrl',
        'https://api.linkedin.com/rest/identityMe',
      ),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': this.apiVersion(),
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
    );

    if (response.status === 403 || response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`LinkedIn identityMe failed (${response.status})`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  mapProfile(
    userinfo: Record<string, unknown>,
    identityMe: Record<string, unknown> | null,
  ): LinkedInProfileData {
    const basicInfo = (identityMe?.basicInfo as Record<string, unknown>) ?? {};
    const currentPosition =
      (identityMe?.primaryCurrentPosition as Record<string, unknown>) ?? null;

    const positions: LinkedInPositionSummary[] = currentPosition
      ? [
          {
            title: pickLocalized(currentPosition.title),
            companyName: pickLocalized(currentPosition.companyName),
            companyPageUrl:
              typeof currentPosition.companyPageUrl === 'string'
                ? currentPosition.companyPageUrl
                : null,
            startedOn:
              typeof currentPosition.startedOn === 'object'
                ? currentPosition.startedOn
                : null,
            isCurrent: true,
          },
        ]
      : [];

    const educationRecord =
      (identityMe?.mostRecentEducation as Record<string, unknown>) ?? null;
    const education: LinkedInEducationSummary[] = educationRecord
      ? [
          {
            schoolName: pickLocalized(educationRecord.schoolName),
            degreeName: pickLocalized(educationRecord.degreeName),
            fieldOfStudy: pickLocalized(educationRecord.fieldOfStudy),
            startedOn: null,
            endedOn: null,
          },
        ]
      : [];

    const memberId = String(userinfo.sub ?? '');
    const profileUrl =
      typeof basicInfo.profileUrl === 'string' ? basicInfo.profileUrl : null;

    return withApiOnlyEnrichment({
      memberId,
      fullName: typeof userinfo.name === 'string' ? userinfo.name : null,
      firstName:
        typeof userinfo.given_name === 'string' ? userinfo.given_name : null,
      lastName:
        typeof userinfo.family_name === 'string' ? userinfo.family_name : null,
      email: typeof userinfo.email === 'string' ? userinfo.email : null,
      pictureUrl:
        typeof userinfo.picture === 'string' ? userinfo.picture : null,
      headline: null,
      summary: null,
      currentTitle: currentPosition
        ? pickLocalized(currentPosition.title)
        : null,
      currentCompany: currentPosition
        ? pickLocalized(currentPosition.companyName)
        : null,
      profileUrl,
      locale: typeof userinfo.locale === 'string' ? userinfo.locale : null,
      positions,
      education,
      syncedAt: new Date().toISOString(),
    });
  }

  async publishTextPost(input: {
    accessToken: string;
    memberId: string;
    commentary: string;
  }): Promise<LinkedInPublishResult> {
    return this.publishPost(input);
  }

  async initializeImageUpload(input: {
    accessToken: string;
    ownerUrn: string;
  }): Promise<{ uploadUrl: string; imageUrn: string }> {
    if (this.isMock()) {
      return {
        uploadUrl: 'https://www.linkedin.com/mock-upload',
        imageUrn: `urn:li:image:mock-${Date.now()}`,
      };
    }

    const restBaseUrl = this.configService.get<string>(
      'linkedin.restBaseUrl',
      'https://api.linkedin.com/rest',
    );

    const response = await fetch(
      `${restBaseUrl}/images?action=initializeUpload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': this.apiVersion(),
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: input.ownerUrn,
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `LinkedIn image upload init failed (${response.status}): ${body}`,
      );
    }

    const payload = (await response.json()) as {
      value?: { uploadUrl?: string; image?: string };
    };

    const uploadUrl = payload.value?.uploadUrl;
    const imageUrn = payload.value?.image;

    if (!uploadUrl || !imageUrn) {
      throw new Error('LinkedIn image upload init returned an invalid payload');
    }

    return { uploadUrl, imageUrn };
  }

  async uploadImageBinary(input: {
    uploadUrl: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<void> {
    if (this.isMock()) {
      return;
    }

    const response = await fetch(input.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': input.mimeType,
      },
      body: new Uint8Array(input.buffer),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `LinkedIn image upload failed (${response.status}): ${body}`,
      );
    }
  }

  async publishPost(input: {
    accessToken: string;
    memberId: string;
    commentary: string;
    media?: { imageUrn: string; altText: string };
  }): Promise<LinkedInPublishResult> {
    if (this.isMock()) {
      return {
        linkedInPostId: `urn:li:share:mock-${Date.now()}`,
        linkedInPostUrl: 'https://www.linkedin.com/feed/update/mock',
      };
    }

    const body: Record<string, unknown> = {
      author: `urn:li:person:${input.memberId}`,
      commentary: input.commentary,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED' },
      lifecycleState: 'PUBLISHED',
    };

    if (input.media) {
      body.content = {
        media: {
          id: input.media.imageUrn,
          altText: input.media.altText,
        },
      };
    }

    const response = await fetch(
      `${this.configService.get<string>('linkedin.restBaseUrl', 'https://api.linkedin.com/rest')}/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': this.apiVersion(),
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `LinkedIn publish failed (${response.status}): ${responseBody}`,
      );
    }

    const linkedInPostId =
      response.headers.get('x-restli-id') ??
      response.headers.get('x-linkedin-id') ??
      `urn:li:share:${Date.now()}`;

    return {
      linkedInPostId,
      linkedInPostUrl: null,
    };
  }
}

export function buildPostCommentary(post: {
  hook: string;
  body: string | null;
  cta: string | null;
}) {
  return [post.hook, post.body, post.cta].filter(Boolean).join('\n\n');
}
