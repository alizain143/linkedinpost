import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { buildPost, postId, userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { ClerkOAuthService } from './clerk-oauth.service';
import { LinkedInApiClient } from './linkedin-api.client';
import {
  LinkedInProfileService,
  LinkedInPublishService,
} from './linkedin.services';

describe('LinkedInPublishService', () => {
  let service: LinkedInPublishService;
  const prisma = createMockPrismaService();
  const clerkOAuthService = {
    getLinkedInAccessToken: jest.fn(),
  };
  const linkedInApiClient = {
    initializeImageUpload: jest.fn(),
    uploadImageBinary: jest.fn(),
    publishPost: jest.fn(),
  };
  const linkedInProfileService = {
    syncProfile: jest.fn(),
  };
  const mediaService = {
    getPrimaryPublishMedia: jest.fn(),
  };

  const approvedPost = buildPost({
    id: postId,
    status: PostPackageStatus.approved,
    hook: 'Hook',
    body: 'Body',
    cta: 'CTA',
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      clerkId: 'clerk-1',
      linkedInMemberId: 'member-1',
    });
    prisma.postPackage.findUniqueOrThrow.mockResolvedValue({
      ...approvedPost,
      _count: { versions: 1 },
    });
    prisma.postPackage.update.mockImplementation(({ data }) => ({
      ...approvedPost,
      ...data,
      _count: { versions: 1 },
    }));
    clerkOAuthService.getLinkedInAccessToken.mockResolvedValue('token');
    linkedInApiClient.publishPost.mockResolvedValue({
      linkedInPostId: 'urn:li:share:123',
      linkedInPostUrl: null,
    });
    mediaService.getPrimaryPublishMedia.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInPublishService,
        { provide: PrismaService, useValue: prisma },
        { provide: ClerkOAuthService, useValue: clerkOAuthService },
        { provide: LinkedInApiClient, useValue: linkedInApiClient },
        { provide: LinkedInProfileService, useValue: linkedInProfileService },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get(LinkedInPublishService);
  });

  it('publishes text-only when post has no media', async () => {
    await service.publishPostForOwner(postId, userId);

    expect(linkedInApiClient.publishPost).toHaveBeenCalledWith({
      accessToken: 'token',
      memberId: 'member-1',
      commentary: 'Hook\n\nBody\n\nCTA',
    });
    expect(linkedInApiClient.initializeImageUpload).not.toHaveBeenCalled();
  });

  it('uploads image and publishes with media when post has media', async () => {
    mediaService.getPrimaryPublishMedia.mockResolvedValue({
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
      altText: 'Quote card',
    });
    linkedInApiClient.initializeImageUpload.mockResolvedValue({
      uploadUrl: 'https://www.linkedin.com/upload',
      imageUrn: 'urn:li:image:abc',
    });

    await service.publishPostForOwner(postId, userId);

    expect(linkedInApiClient.initializeImageUpload).toHaveBeenCalledWith({
      accessToken: 'token',
      ownerUrn: 'urn:li:person:member-1',
    });
    expect(linkedInApiClient.uploadImageBinary).toHaveBeenCalledWith({
      uploadUrl: 'https://www.linkedin.com/upload',
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
    });
    expect(linkedInApiClient.publishPost).toHaveBeenCalledWith({
      accessToken: 'token',
      memberId: 'member-1',
      commentary: 'Hook\n\nBody\n\nCTA',
      media: {
        imageUrn: 'urn:li:image:abc',
        altText: 'Quote card',
      },
    });
  });
});
