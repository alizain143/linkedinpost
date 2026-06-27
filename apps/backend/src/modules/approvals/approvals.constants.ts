import { PostPackageStatus, Prisma } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';

export enum ApprovalTab {
  mine = 'mine',
  client = 'client',
  changes = 'changes',
  approved = 'approved',
}

export const APPROVAL_TABS: ApprovalTab[] = [
  ApprovalTab.mine,
  ApprovalTab.client,
  ApprovalTab.changes,
  ApprovalTab.approved,
];

export function getTabWhere(
  tab: ApprovalTab,
  workspaceId: string,
  clientWorkspaceIds: string[],
): Prisma.PostPackageWhereInput {
  switch (tab) {
    case ApprovalTab.mine:
      return {
        workspaceId,
        status: PostPackageStatus.ready_for_approval,
        ...NOT_DELETED,
      };
    case ApprovalTab.approved:
      return {
        workspaceId,
        status: PostPackageStatus.approved,
        ...NOT_DELETED,
      };
    case ApprovalTab.changes:
      return {
        workspaceId,
        status: PostPackageStatus.draft,
        approvalFeedback: { not: null },
        ...NOT_DELETED,
      };
    case ApprovalTab.client:
      return {
        workspaceId: { in: clientWorkspaceIds },
        status: PostPackageStatus.ready_for_approval,
        ...NOT_DELETED,
      };
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export function getCountWheres(
  workspaceId: string,
  clientWorkspaceIds: string[],
): Record<ApprovalTab, Prisma.PostPackageWhereInput> {
  return {
    [ApprovalTab.mine]: getTabWhere(
      ApprovalTab.mine,
      workspaceId,
      clientWorkspaceIds,
    ),
    [ApprovalTab.client]: getTabWhere(
      ApprovalTab.client,
      workspaceId,
      clientWorkspaceIds,
    ),
    [ApprovalTab.changes]: getTabWhere(
      ApprovalTab.changes,
      workspaceId,
      clientWorkspaceIds,
    ),
    [ApprovalTab.approved]: getTabWhere(
      ApprovalTab.approved,
      workspaceId,
      clientWorkspaceIds,
    ),
  };
}
