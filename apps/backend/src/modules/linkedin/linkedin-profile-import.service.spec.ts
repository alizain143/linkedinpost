import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { createMockPrismaService } from '../../test/prisma.mock';
import { workspaceId, userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LinkedInProfileImportService } from './linkedin-profile-import.service';
import { ProfileImportTokenService } from './profile-import-token.service';
import { LinkedInOAuthService } from './linkedin-oauth.service';
import { LinkedInApiClient } from './linkedin-api.client';
import { withApiOnlyEnrichment } from './profile-import.merge';

describe('LinkedInProfileImportService', () => {
  let service: LinkedInProfileImportService;
  let tokenService: ProfileImportTokenService;
  const prisma = createMockPrismaService();
  const workspacesService = {
    assertMember: jest.fn(),
  };
  const linkedInOAuthService = {
    getWorkspaceAccessToken: jest.fn().mockResolvedValue(null),
  };
  const linkedInApiClient = {
    fetchUserInfo: jest.fn(),
    fetchIdentityMe: jest.fn(),
    mapProfile: jest.fn(),
  };

  const baseProfile = withApiOnlyEnrichment({
    memberId: 'member-1',
    fullName: 'Jane Doe',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    pictureUrl: null,
    headline: null,
    summary: null,
    currentTitle: null,
    currentCompany: null,
    profileUrl: 'https://www.linkedin.com/in/jane-doe',
    locale: null,
    positions: [],
    education: [],
    syncedAt: '2026-01-01T00:00:00.000Z',
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      id: workspaceId,
      type: 'personal',
      ownerId: userId,
      linkedInClerkExternalAccountId: null,
      linkedInMemberId: 'member-1',
      linkedInProfileName: 'Jane Doe',
      linkedInProfile: baseProfile,
      linkedInProfileSyncedAt: new Date(),
      linkedInAccessToken: 'token',
      linkedInRefreshToken: null,
      linkedInTokenExpiresAt: new Date(Date.now() + 3600000),
    });
    prisma.workspace.update.mockImplementation(({ data }) => ({
      id: workspaceId,
      ...data,
    }));
    workspacesService.assertMember.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInProfileImportService,
        ProfileImportTokenService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: WorkspacesService,
          useValue: workspacesService,
        },
        {
          provide: LinkedInOAuthService,
          useValue: linkedInOAuthService,
        },
        {
          provide: LinkedInApiClient,
          useValue: linkedInApiClient,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'clerk.secretKey') return 'test-secret';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get(LinkedInProfileImportService);
    tokenService = module.get(ProfileImportTokenService);
  });

  it('imports profile when slug matches connected account', async () => {
    const profile = await service.importProfile(workspaceId, userId, {
      profileUrl: 'https://www.linkedin.com/in/jane-doe',
      headline: 'New headline',
      summary: 'About me',
    });

    expect(profile.headline).toBe('New headline');
    expect(profile.enrichmentStatus).toBe('complete');
    expect(prisma.workspace.update).toHaveBeenCalled();
  });

  it('rejects import when profile slug mismatches', async () => {
    await expect(
      service.importProfile(workspaceId, userId, {
        profileUrl: 'https://www.linkedin.com/in/someone-else',
        headline: 'Hacker',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('accepts import via valid import token without actor user id', async () => {
    const { token } = tokenService.createToken(workspaceId, userId);

    const profile = await service.importProfile(workspaceId, null, {
      profileUrl: 'https://www.linkedin.com/in/jane-doe',
      headline: 'Via extension',
      importToken: token,
    });

    expect(profile.headline).toBe('Via extension');
  });

  it('creates import token with connected profile slug URL', async () => {
    const result = await service.createImportToken(workspaceId, userId);

    expect(result.expectedProfileSlug).toBe('jane-doe');
    expect(result.linkedInImportUrl).toContain('/in/jane-doe');
    expect(result.linkedInImportUrl).not.toContain('/in/me');
  });

  it('creates import token from profileUrl hint when cache is empty', async () => {
    prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      id: workspaceId,
      type: 'personal',
      ownerId: userId,
      linkedInClerkExternalAccountId: null,
      linkedInMemberId: 'member-1',
      linkedInProfileName: 'Jane Doe',
      linkedInProfile: { ...baseProfile, profileUrl: null },
      linkedInProfileSyncedAt: new Date(),
      linkedInAccessToken: 'token',
      linkedInRefreshToken: null,
      linkedInTokenExpiresAt: new Date(Date.now() + 3600000),
    });

    const result = await service.createImportToken(
      workspaceId,
      userId,
      'https://www.linkedin.com/in/jane-doe',
    );

    expect(result.expectedProfileSlug).toBe('jane-doe');
    expect(prisma.workspace.update).toHaveBeenCalled();
  });
});
