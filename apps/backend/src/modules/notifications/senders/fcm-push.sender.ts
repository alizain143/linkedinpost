import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import {
  getMessaging,
  type BatchResponse,
  type Messaging,
} from 'firebase-admin/messaging';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PushSendParams {
  userId: string;
  title: string;
  body: string;
  actionUrl: string | null;
  notificationId: string;
}

@Injectable()
export class FcmPushSender implements OnModuleInit {
  private readonly logger = new Logger(FcmPushSender.name);
  private messaging: Messaging | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase admin not configured; push delivery disabled');
      return;
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    this.messaging = getMessaging();
  }

  isConfigured(): boolean {
    return Boolean(this.messaging);
  }

  async send(params: PushSendParams): Promise<string | null> {
    if (!this.messaging) {
      this.logger.warn('FCM not configured; skipping push send');
      return null;
    }

    const tokens = await this.prisma.pushDeviceToken.findMany({
      where: { userId: params.userId, revokedAt: null },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return null;
    }

    const response = await this.messaging.sendEachForMulticast({
      fids: tokens.map((entry) => entry.token),
      notification: {
        title: params.title,
        body: params.body,
      },
      data: {
        notificationId: params.notificationId,
        actionUrl: params.actionUrl ?? '',
        title: params.title,
        body: params.body,
      },
      webpush: params.actionUrl
        ? {
            fcmOptions: {
              link: params.actionUrl,
            },
          }
        : undefined,
    });

    await this.revokeInvalidTokens(tokens.map((entry) => entry.token), response);

    if (response.failureCount > 0 && response.successCount === 0) {
      throw new Error('All FCM push deliveries failed');
    }

    return `fcm:${response.successCount}/${tokens.length}`;
  }

  private async revokeInvalidTokens(
    tokens: string[],
    response: BatchResponse,
  ) {
    const invalidTokens: string[] = [];

    response.responses.forEach((result, index) => {
      if (!result.success && result.error) {
        const code = result.error.code;
        if (
          code === 'messaging/installation-id-not-registered' ||
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length === 0) {
      return;
    }

    await this.prisma.pushDeviceToken.updateMany({
      where: { token: { in: invalidTokens } },
      data: { revokedAt: new Date() },
    });
  }
}
