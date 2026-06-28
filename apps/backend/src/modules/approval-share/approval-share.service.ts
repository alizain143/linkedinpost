import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApprovalToken,
  PostPackage,
  PostPackageStatus,
  Prisma,
  Workspace,
} from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { MediaService } from '../media/media.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  generateApprovalRawToken,
  hashApprovalToken,
} from './approval-token.util';
import { ApprovalLinkStatusResponseDto } from './dto/approval-link-status-response.dto';
import { CreateApprovalLinkResponseDto } from './dto/create-approval-link-response.dto';
import { PublicApprovalActionResponseDto } from './dto/public-approval-preview.dto';
import {
  assertPostAwaitingApproval,
  toPublicApprovalPreview,
} from './public-approval.mapper';

export type ResolvedApprovalContext = {
  token: ApprovalToken;
  post: PostPackage;
  workspace: Workspace;
};

@Injectable()
export class ApprovalShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly workspacesService: WorkspacesService,
    private readonly planFeatureService: PlanFeatureService,
    private readonly mediaService: MediaService,
  ) {}

  private getFrontendUrl(): string {
    return this.configService.get<string>('app.frontendUrl')!;
  }

  private getExpiryDays(): number {
    return this.configService.get<number>('app.approvalLinkExpiryDays')!;
  }

  private buildShareUrl(rawToken: string): string {
    return `${this.getFrontendUrl()}/approve/${rawToken}`;
  }

  private computeExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.getExpiryDays());
    return expiresAt;
  }

  private async findPostInWorkspace(workspaceId: string, postId: string) {
    const post = await this.prisma.postPackage.findFirst({
      where: { id: postId, workspaceId, ...NOT_DELETED },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return post;
  }

  private assertPostReadyForLink(post: PostPackage) {
    if (post.status !== PostPackageStatus.ready_for_approval) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }
  }

  private isTokenActive(token: ApprovalToken): boolean {
    if (token.revokedAt || token.usedAt) {
      return false;
    }
    return token.expiresAt.getTime() > Date.now();
  }

  private throwInvalidLink() {
    throw new NotFoundException({
      error: 'Approval link is invalid or expired',
      code: 'APPROVAL_LINK_INVALID',
    });
  }

  async createLink(
    workspaceId: string,
    postId: string,
    userId: string,
  ): Promise<CreateApprovalLinkResponseDto> {
    await this.planFeatureService.assertAllows(userId, 'approval_share_links');
    await this.workspacesService.assertOwner(userId, workspaceId);

    const post = await this.findPostInWorkspace(workspaceId, postId);
    this.assertPostReadyForLink(post);

    const rawToken = generateApprovalRawToken();
    const tokenHash = hashApprovalToken(rawToken);
    const expiresAt = this.computeExpiresAt();

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalToken.updateMany({
        where: {
          postPackageId: postId,
          revokedAt: null,
          usedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      await tx.approvalToken.create({
        data: {
          postPackageId: postId,
          tokenHash,
          expiresAt,
          createdById: userId,
        },
      });
    });

    return {
      url: this.buildShareUrl(rawToken),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getLinkStatus(
    workspaceId: string,
    postId: string,
    userId: string,
  ): Promise<ApprovalLinkStatusResponseDto> {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.findPostInWorkspace(workspaceId, postId);

    const token = await this.prisma.approvalToken.findFirst({
      where: {
        postPackageId: postId,
        revokedAt: null,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token || !this.isTokenActive(token)) {
      return { active: false };
    }

    return {
      active: true,
      expiresAt: token.expiresAt.toISOString(),
      createdAt: token.createdAt.toISOString(),
    };
  }

  async revokeLink(
    workspaceId: string,
    postId: string,
    userId: string,
  ): Promise<{ revoked: true }> {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.findPostInWorkspace(workspaceId, postId);

    await this.prisma.approvalToken.updateMany({
      where: {
        postPackageId: postId,
        revokedAt: null,
        usedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { revoked: true };
  }

  async resolveToken(rawToken: string): Promise<ResolvedApprovalContext> {
    const tokenHash = hashApprovalToken(rawToken);
    const token = await this.prisma.approvalToken.findUnique({
      where: { tokenHash },
    });

    if (!token || !this.isTokenActive(token)) {
      this.throwInvalidLink();
    }

    const post = await this.prisma.postPackage.findFirst({
      where: { id: token!.postPackageId, ...NOT_DELETED },
    });

    if (!post) {
      this.throwInvalidLink();
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { id: post!.workspaceId, ...NOT_DELETED },
    });

    if (!workspace) {
      this.throwInvalidLink();
    }

    return { token: token!, post: post!, workspace: workspace! };
  }

  async getPreview(rawToken: string) {
    const { post, workspace } = await this.resolveToken(rawToken);
    assertPostAwaitingApproval(post);

    const media = await this.mediaService.listForPost(post.id);
    return toPublicApprovalPreview(post, workspace, media);
  }

  async approve(rawToken: string): Promise<PublicApprovalActionResponseDto> {
    return this.applyPublicApprovalAction(rawToken, 'approve');
  }

  async requestChanges(
    rawToken: string,
    feedback: string,
  ): Promise<PublicApprovalActionResponseDto> {
    return this.applyPublicApprovalAction(rawToken, 'request-changes', feedback);
  }

  async reject(
    rawToken: string,
    feedback?: string,
  ): Promise<PublicApprovalActionResponseDto> {
    return this.applyPublicApprovalAction(rawToken, 'reject', feedback);
  }

  private async applyPublicApprovalAction(
    rawToken: string,
    action: 'approve' | 'request-changes' | 'reject',
    feedback?: string,
  ): Promise<PublicApprovalActionResponseDto> {
    const { token, post } = await this.resolveToken(rawToken);
    assertPostAwaitingApproval(post);

    const to =
      action === 'approve'
        ? PostPackageStatus.approved
        : PostPackageStatus.draft;

    const updated = await this.prisma.$transaction(async (tx) => {
      const statusUpdate = await tx.postPackage.updateMany({
        where: {
          id: post.id,
          ...NOT_DELETED,
          status: PostPackageStatus.ready_for_approval,
        },
        data: this.buildApprovalUpdateData(post, to, feedback),
      });

      if (statusUpdate.count === 0) {
        this.throwInvalidLink();
      }

      const tokenUpdate = await tx.approvalToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
          revokedAt: null,
        },
        data: { usedAt: new Date() },
      });

      if (tokenUpdate.count === 0) {
        this.throwInvalidLink();
      }

      return tx.postPackage.findFirstOrThrow({
        where: { id: post.id, ...NOT_DELETED },
      });
    });

    return { id: updated.id, status: updated.status };
  }

  private buildApprovalUpdateData(
    _post: PostPackage,
    to: PostPackageStatus,
    feedback?: string,
  ): Prisma.PostPackageUpdateManyMutationInput {
    if (to === PostPackageStatus.approved) {
      return { status: to, approvalFeedback: null };
    }

    return {
      status: to,
      approvalFeedback: feedback ?? null,
      submittedForApprovalAt: null,
    };
  }
}
