import { NotFoundException } from '@nestjs/common';
import { PostPackage, PostPackageStatus, Workspace } from '@prisma/client';
import { PostMediaResponse } from '../media/media.types';
import { PublicApprovalPreviewDto } from './dto/public-approval-preview.dto';

export function toPublicApprovalPreview(
  post: PostPackage,
  workspace: Workspace,
  media: PostMediaResponse[],
): PublicApprovalPreviewDto {
  return {
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    tags: post.tags,
    pillar: post.pillar,
    postType: post.postType,
    status: post.status,
    submittedForApprovalAt: post.submittedForApprovalAt?.toISOString() ?? null,
    workspaceName: workspace.name,
    media: media.map((item) => ({
      url: item.url,
      altText: item.altText,
      mimeType: item.mimeType,
    })),
  };
}

export function assertPostAwaitingApproval(post: PostPackage): void {
  if (post.status !== PostPackageStatus.ready_for_approval) {
    throw new NotFoundException({
      error: 'Approval link is invalid or expired',
      code: 'APPROVAL_LINK_INVALID',
    });
  }
}
