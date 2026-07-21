import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { resolveClerkProfileImageUrl } from './clerk-profile-image.util';
import { CreateFromClerkDto } from './dto/create-from-clerk.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  parseToursSeen,
  toUserResponse,
  UserResponse,
} from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async findByClerkId(clerkId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
    });

    if (!user) {
      const deleted = await this.prisma.user.findFirst({
        where: { clerkId, deletedAt: { not: null } },
      });

      if (deleted) {
        throw new UnauthorizedException({
          error: 'Account has been deleted',
          code: 'ACCOUNT_DELETED',
        });
      }

      throw new NotFoundException({
        error: 'User not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException({
        error: 'User not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return user;
  }

  private async finalizeUser(user: User): Promise<User> {
    await this.workspacesService.ensurePersonalWorkspace(
      user.id,
      user.firstName,
    );
    return user;
  }

  async ensureUserSetup(user: User): Promise<User> {
    await this.workspacesService.ensurePersonalWorkspace(
      user.id,
      user.firstName,
    );
    return user;
  }

  async createFromClerk(dto: CreateFromClerkDto): Promise<User> {
    const profileImageUrl = resolveClerkProfileImageUrl(
      dto.profileImageUrl,
      dto.hasClerkProfileImage,
    );

    const existing = await this.prisma.user.findUnique({
      where: { clerkId: dto.clerkId },
    });

    if (existing) {
      if (existing.deletedAt) {
        throw new UnauthorizedException({
          error: 'Account has been deleted',
          code: 'ACCOUNT_DELETED',
        });
      }

      if (
        profileImageUrl &&
        !existing.profileDocumentId &&
        !existing.profileImageUrl
      ) {
        const user = await this.prisma.user.update({
          where: { id: existing.id },
          data: { profileImageUrl },
        });
        return this.finalizeUser(user);
      }

      return this.finalizeUser(existing);
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      // Same verified email, different Clerk user id (e.g. account recreated).
      // Relink — Clerk session already proves email ownership.
      const user = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          deletedAt: null,
          clerkId: dto.clerkId,
          firstName: dto.firstName ?? existingByEmail.firstName,
          lastName: dto.lastName ?? existingByEmail.lastName,
          profileImageUrl:
            profileImageUrl &&
            !existingByEmail.profileDocumentId &&
            !existingByEmail.profileImageUrl
              ? profileImageUrl
              : existingByEmail.profileImageUrl,
        },
      });
      return this.finalizeUser(user);
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          clerkId: dto.clerkId,
          email: dto.email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          profileImageUrl,
        },
      });
      return this.finalizeUser(user);
    } catch (error) {
      const raced = await this.prisma.user.findFirst({
        where: {
          OR: [{ clerkId: dto.clerkId }, { email: dto.email }],
        },
      });

      if (raced) {
        return this.finalizeUser(raced);
      }

      throw error;
    }
  }

  async syncClerkProfileImageIfMissing(
    user: User,
    imageUrl?: string | null,
    hasImage?: boolean | null,
  ): Promise<User> {
    const profileImageUrl = resolveClerkProfileImageUrl(imageUrl, hasImage);

    if (user.profileDocumentId || user.profileImageUrl || !profileImageUrl) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { profileImageUrl },
    });
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    await this.findById(userId);
    const {
      profileDocumentId,
      notifications,
      timezone,
      markTourSeen,
      lastAcknowledgedPlan,
      ...profileFields
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      if (profileDocumentId !== undefined) {
        const previousDocumentId = user.profileDocumentId;

        await this.documentsService.attachProfileDocument({
          documentId: profileDocumentId,
          userId,
        });

        if (previousDocumentId && previousDocumentId !== profileDocumentId) {
          await this.documentsService.removeDocument(
            previousDocumentId,
            userId,
          );
        }
      }

      const notificationData = notifications
        ? {
            ...(notifications.weeklyReminders !== undefined
              ? { emailWeeklyReminders: notifications.weeklyReminders }
              : {}),
            ...(notifications.generationComplete !== undefined
              ? { emailGenerationComplete: notifications.generationComplete }
              : {}),
            ...(notifications.productUpdates !== undefined
              ? { emailProductUpdates: notifications.productUpdates }
              : {}),
            ...(notifications.publishAlerts !== undefined
              ? { emailPublishAlerts: notifications.publishAlerts }
              : {}),
            ...(notifications.pushEnabled !== undefined
              ? { pushEnabled: notifications.pushEnabled }
              : {}),
          }
        : {};

      const now = new Date();
      const data: Prisma.UserUncheckedUpdateInput = {
        ...profileFields,
        ...(timezone !== undefined ? { timezone } : {}),
        ...notificationData,
        ...(profileDocumentId !== undefined ? { profileDocumentId } : {}),
      };

      if (markTourSeen) {
        const existing = parseToursSeen(user.toursSeen);
        data.toursSeen = {
          ...existing,
          [markTourSeen]: now.toISOString(),
        };
      }

      if (lastAcknowledgedPlan !== undefined) {
        data.lastAcknowledgedPlan = lastAcknowledgedPlan;
      }

      return tx.user.update({
        where: { id: userId },
        data,
      });
    });
  }

  async toUserResponse(user: User): Promise<UserResponse> {
    const [profileImageUrl, personalWorkspace] = await Promise.all([
      user.profileDocumentId
        ? this.documentsService.getProfileImageUrl(user.profileDocumentId)
        : Promise.resolve(user.profileImageUrl),
      this.workspacesService.findPersonalWorkspace(user.id),
    ]);

    return toUserResponse(user, profileImageUrl, personalWorkspace?.id ?? null);
  }

  async softDelete(clerkId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });
  }
}
