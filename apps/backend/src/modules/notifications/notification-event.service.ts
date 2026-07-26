import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildNotificationCopy } from './notification-copy';
import { NotificationDispatchService } from './notification-dispatch.service';

export interface EmitNotificationInput {
  userId: string;
  workspaceId?: string | null;
  type: NotificationType;
  dedupeKey?: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  postHook?: string | null;
  workspaceName?: string | null;
  /** When set, overrides buildNotificationCopy title/body. */
  title?: string;
  body?: string;
}

@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: NotificationDispatchService,
    private readonly configService: ConfigService,
  ) {}

  async emit(input: EmitNotificationInput): Promise<void> {
    try {
      if (input.dedupeKey) {
        const existing = await this.prisma.notification.findUnique({
          where: { dedupeKey: input.dedupeKey },
        });
        if (existing) {
          return;
        }
      }

      const copy =
        input.title && input.body
          ? { title: input.title, body: input.body }
          : buildNotificationCopy({
              type: input.type,
              postHook: input.postHook,
              workspaceName: input.workspaceName,
            });

      const actionUrl =
        input.actionUrl ?? this.buildActionUrl(input) ?? null;

      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          workspaceId: input.workspaceId ?? null,
          type: input.type,
          title: copy.title,
          body: copy.body,
          actionUrl,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          metadata: input.metadata,
          dedupeKey: input.dedupeKey ?? null,
        },
      });

      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: input.userId },
      });

      await this.dispatchService.dispatchForUser(user, notification);
    } catch (error) {
      this.logger.error(
        `Failed to emit notification ${input.type} for user ${input.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async emitGenerationComplete(params: {
    userId: string;
    workspaceId: string;
    generationJobId: string;
    postPackageId?: string | null;
    postHook?: string | null;
  }) {
    await this.emit({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: NotificationType.generation_complete,
      dedupeKey: `generation_complete:${params.generationJobId}`,
      entityType: params.postPackageId ? 'post' : 'job',
      entityId: params.postPackageId ?? params.generationJobId,
      postHook: params.postHook,
    });
  }

  async emitPostReadyForApproval(params: {
    userId: string;
    workspaceId: string;
    postPackageId: string;
    postHook?: string | null;
  }) {
    await this.emit({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: NotificationType.post_ready_for_approval,
      dedupeKey: `post_ready_for_approval:${params.postPackageId}`,
      entityType: 'post',
      entityId: params.postPackageId,
      postHook: params.postHook,
    });
  }

  async emitPublishResult(params: {
    userId: string;
    workspaceId: string;
    postPackageId: string;
    postHook?: string | null;
    succeeded: boolean;
  }) {
    await this.emit({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: params.succeeded
        ? NotificationType.publish_succeeded
        : NotificationType.publish_failed,
      dedupeKey: `${params.succeeded ? 'publish_succeeded' : 'publish_failed'}:${params.postPackageId}`,
      entityType: 'post',
      entityId: params.postPackageId,
      postHook: params.postHook,
    });
  }

  async emitClientApprovalAction(params: {
    userId: string;
    workspaceId: string;
    postPackageId: string;
    postHook?: string | null;
    action: 'approve' | 'request-changes';
  }) {
    await this.emit({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type:
        params.action === 'approve'
          ? NotificationType.client_approved
          : NotificationType.client_requested_changes,
      dedupeKey: `client_${params.action}:${params.postPackageId}`,
      entityType: 'post',
      entityId: params.postPackageId,
      postHook: params.postHook,
    });
  }

  async emitWeeklyReminder(userId: string, dedupeKey: string) {
    await this.emit({
      userId,
      type: NotificationType.weekly_content_reminder,
      dedupeKey,
    });
  }

  async emitAutopilotPausedCredits(params: {
    userId: string;
    workspaceId: string;
    workspaceName?: string | null;
    plan: string;
    remaining: number;
    required: number;
    dedupeKey: string;
  }) {
    const isAgency = params.plan === 'agency';
    const cta = isAgency
      ? 'Buy more credits on the Billing page to resume Autopilot.'
      : 'Buy more credits or upgrade your plan on the Billing page to resume Autopilot.';

    await this.emit({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: NotificationType.autopilot_paused_credits,
      dedupeKey: params.dedupeKey,
      entityType: 'autopilot',
      entityId: params.workspaceId,
      workspaceName: params.workspaceName,
      title: 'Autopilot paused — out of credits',
      body: `Autopilot was turned off because this run needed ${params.required} credits and you only had ${params.remaining} left. ${cta}`,
      actionUrl: undefined,
      metadata: {
        remaining: params.remaining,
        required: params.required,
        plan: params.plan,
      },
    });
  }

  private buildActionUrl(input: EmitNotificationInput): string | null {
    const frontendUrl =
      this.configService.get<string>('resend.frontendUrl') ??
      'http://localhost:3000';

    if (input.entityType === 'post' && input.entityId) {
      return `${frontendUrl}/app/posts/${input.entityId}`;
    }

    switch (input.type) {
      case NotificationType.post_ready_for_approval:
      case NotificationType.client_approved:
      case NotificationType.client_requested_changes:
        return `${frontendUrl}/app/approvals`;
      case NotificationType.publish_succeeded:
      case NotificationType.publish_failed:
        return `${frontendUrl}/app/calendar`;
      case NotificationType.weekly_content_reminder:
        return `${frontendUrl}/app/generate/calendar`;
      case NotificationType.autopilot_paused_credits:
        return `${frontendUrl}/app/billing#buy-credits`;
      default:
        return `${frontendUrl}/app`;
    }
  }
}
