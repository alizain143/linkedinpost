import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import {
  NotificationListResponse,
  toNotificationResponse,
} from './notification.mapper';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: NotificationsQueryDto,
  ): Promise<NotificationListResponse> {
    const limit = query.limit ?? 20;
    const cursor = query.cursor
      ? this.decodeCursor(query.cursor)
      : undefined;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              {
                createdAt: cursor.createdAt,
                id: { lt: cursor.id },
              },
            ],
          }
        : {}),
    };

    const items = await this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const last = page[page.length - 1];

    return {
      items: page.map(toNotificationResponse),
      nextCursor:
        hasMore && last
          ? this.encodeCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        error: 'Notification not found',
      });
    }

    const notification = await this.prisma.notification.findUniqueOrThrow({
      where: { id: notificationId },
    });

    return toNotificationResponse(notification);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async registerDevice(
    userId: string,
    token: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.pushDeviceToken.findUnique({
      where: { token },
    });

    if (existing) {
      return this.prisma.pushDeviceToken.update({
        where: { token },
        data: {
          userId,
          userAgent: userAgent ?? existing.userAgent,
          lastSeenAt: new Date(),
          revokedAt: null,
        },
      });
    }

    return this.prisma.pushDeviceToken.create({
      data: {
        userId,
        token,
        userAgent,
      },
    });
  }

  async revokeDevice(userId: string, token: string) {
    await this.prisma.pushDeviceToken.updateMany({
      where: { userId, token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private encodeCursor(cursor: { createdAt: Date; id: string }) {
    return Buffer.from(
      JSON.stringify({
        createdAt: cursor.createdAt.toISOString(),
        id: cursor.id,
      }),
    ).toString('base64url');
  }

  private decodeCursor(cursor: string) {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as { createdAt: string; id: string };
      return {
        createdAt: new Date(parsed.createdAt),
        id: parsed.id,
      };
    } catch {
      throw new NotFoundException({
        code: 'INVALID_CURSOR',
        error: 'Invalid pagination cursor',
      });
    }
  }
}
