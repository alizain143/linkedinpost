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
    const now = new Date();

    const device = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.pushDeviceToken.findUnique({
        where: { token },
      });

      const record = existing
        ? await tx.pushDeviceToken.update({
            where: { token },
            data: {
              userId,
              userAgent: userAgent ?? existing.userAgent,
              lastSeenAt: now,
              revokedAt: null,
            },
          })
        : await tx.pushDeviceToken.create({
            data: {
              userId,
              token,
              userAgent,
            },
          });

      // One active token per browser profile — drop stale tokens from the same UA.
      if (userAgent) {
        await tx.pushDeviceToken.updateMany({
          where: {
            userId,
            userAgent,
            token: { not: token },
            revokedAt: null,
          },
          data: { revokedAt: now },
        });
      }

      return record;
    });

    await this.enforceDeviceTokenLimit(userId);

    return device;
  }

  /** Keep the most recently seen devices; revoke excess stale registrations. */
  private async enforceDeviceTokenLimit(
    userId: string,
    maxActive = 5,
  ) {
    const active = await this.prisma.pushDeviceToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true },
    });

    if (active.length <= maxActive) {
      return;
    }

    const revokeIds = active.slice(maxActive).map((entry) => entry.id);
    await this.prisma.pushDeviceToken.updateMany({
      where: { id: { in: revokeIds } },
      data: { revokedAt: new Date() },
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
