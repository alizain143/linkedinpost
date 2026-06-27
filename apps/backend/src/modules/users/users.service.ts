import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { resolveClerkProfileImageUrl } from './clerk-profile-image.util';
import { CreateFromClerkDto } from './dto/create-from-clerk.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toUserResponse, UserResponse } from './user.mapper';
import { DocumentAttachedToType } from '../../common/constants/document.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
  ) {}

  async findByClerkId(clerkId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { clerkId, deletedAt: null },
    });

    if (!user) {
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
        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            email: dto.email,
            firstName: dto.firstName ?? null,
            lastName: dto.lastName ?? null,
            profileImageUrl:
              profileImageUrl && !existing.profileDocumentId
                ? profileImageUrl
                : existing.profileImageUrl,
          },
        });
      }

      if (
        profileImageUrl &&
        !existing.profileDocumentId &&
        !existing.profileImageUrl
      ) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { profileImageUrl },
        });
      }

      return existing;
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      return this.prisma.user.update({
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
    }

    try {
      return await this.prisma.user.create({
        data: {
          clerkId: dto.clerkId,
          email: dto.email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          profileImageUrl,
        },
      });
    } catch (error) {
      const raced = await this.prisma.user.findFirst({
        where: {
          OR: [{ clerkId: dto.clerkId }, { email: dto.email }],
        },
      });

      if (raced) {
        return raced;
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
    const user = await this.findById(userId);
    const { profileDocumentId, ...profileFields } = dto;

    if (profileDocumentId !== undefined) {
      const previousDocumentId = user.profileDocumentId;

      await this.documentsService.attachDocument({
        documentId: profileDocumentId,
        userId,
        entityType: DocumentAttachedToType.USER,
        entityId: userId,
      });

      if (previousDocumentId && previousDocumentId !== profileDocumentId) {
        await this.documentsService.removeDocument(previousDocumentId, userId);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...profileFields,
        ...(profileDocumentId !== undefined
          ? { profileDocumentId }
          : undefined),
      },
    });
  }

  async toUserResponse(user: User): Promise<UserResponse> {
    const profileImageUrl = user.profileDocumentId
      ? await this.documentsService.getProfileImageUrl(user.profileDocumentId)
      : user.profileImageUrl;

    return toUserResponse(user, profileImageUrl);
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
