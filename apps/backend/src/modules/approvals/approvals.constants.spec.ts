import {
  ApprovalTab,
  APPROVAL_TABS,
  getCountWheres,
  getTabWhere,
} from './approvals.constants';
import { PostPackageStatus } from '@prisma/client';

describe('approvals.constants', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const clientWorkspaceIds = ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'];

  it('defines four approval tabs', () => {
    expect(APPROVAL_TABS).toEqual([
      ApprovalTab.mine,
      ApprovalTab.client,
      ApprovalTab.changes,
      ApprovalTab.approved,
    ]);
  });

  it('maps mine tab to ready_for_approval in workspace', () => {
    expect(getTabWhere(ApprovalTab.mine, workspaceId, clientWorkspaceIds)).toEqual({
      workspaceId,
      status: PostPackageStatus.ready_for_approval,
    });
  });

  it('maps approved tab to approved status in workspace', () => {
    expect(
      getTabWhere(ApprovalTab.approved, workspaceId, clientWorkspaceIds),
    ).toEqual({
      workspaceId,
      status: PostPackageStatus.approved,
    });
  });

  it('maps changes tab to draft with feedback', () => {
    expect(
      getTabWhere(ApprovalTab.changes, workspaceId, clientWorkspaceIds),
    ).toEqual({
      workspaceId,
      status: PostPackageStatus.draft,
      approvalFeedback: { not: null },
    });
  });

  it('maps client tab to client workspaces ready_for_approval', () => {
    expect(
      getTabWhere(ApprovalTab.client, workspaceId, clientWorkspaceIds),
    ).toEqual({
      workspaceId: { in: clientWorkspaceIds },
      status: PostPackageStatus.ready_for_approval,
    });
  });

  it('builds count wheres for all tabs', () => {
    const wheres = getCountWheres(workspaceId, clientWorkspaceIds);

    expect(Object.keys(wheres).sort()).toEqual(
      [...APPROVAL_TABS].sort(),
    );
  });
});
