import { Injectable } from '@nestjs/common';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { LinkedInProfileService } from '../linkedin/linkedin.services';
import {
  resolveTemplateProfile,
  ResolvedTemplateProfile,
  TemplateProfileSourceInput,
} from './template-profile-resolver';

@Injectable()
export class TemplateProfileResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly linkedInProfileService: LinkedInProfileService,
  ) {}

  async resolveForWorkspace(
    workspaceId: string,
    userId: string,
    overrides?: TemplateProfileSourceInput['overrides'],
  ): Promise<ResolvedTemplateProfile> {
    const [linkedInProfile, contentProfile, user] = await Promise.all([
      this.linkedInProfileService.getWorkspaceProfile(workspaceId, userId),
      this.prisma.contentProfile.findFirst({
        where: { workspaceId, ...NOT_DELETED },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        select: {
          name: true,
          roleTitle: true,
          industry: true,
          brandPrimary: true,
          brandAccent: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          profileImageUrl: true,
        },
      }),
    ]);

    return resolveTemplateProfile({
      linkedInProfile,
      contentProfile,
      user,
      overrides,
    });
  }
}
