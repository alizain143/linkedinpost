import { Prisma, WorkspaceType } from '@prisma/client';

/** Workspace fields used by LinkedIn bind/publish flows. */
export type WorkspaceLinkedInRecord = {
  id: string;
  type: WorkspaceType;
  ownerId: string;
  linkedInClerkExternalAccountId: string | null;
  linkedInMemberId: string | null;
  linkedInProfileName: string | null;
  linkedInProfile: Prisma.JsonValue | null;
  linkedInProfileSyncedAt: Date | null;
  linkedInAccessToken: string | null;
  linkedInRefreshToken: string | null;
  linkedInTokenExpiresAt: Date | null;
};

export const WORKSPACE_LINKEDIN_SELECT = {
  id: true,
  type: true,
  ownerId: true,
  linkedInClerkExternalAccountId: true,
  linkedInMemberId: true,
  linkedInProfileName: true,
  linkedInProfile: true,
  linkedInProfileSyncedAt: true,
  linkedInAccessToken: true,
  linkedInRefreshToken: true,
  linkedInTokenExpiresAt: true,
} as Prisma.WorkspaceSelect;

export const CLEAR_WORKSPACE_LINKEDIN_UPDATE = {
  linkedInClerkExternalAccountId: null,
  linkedInMemberId: null,
  linkedInProfileName: null,
  linkedInProfile: Prisma.DbNull,
  linkedInProfileSyncedAt: null,
  linkedInAccessToken: null,
  linkedInRefreshToken: null,
  linkedInTokenExpiresAt: null,
} as Prisma.WorkspaceUpdateInput;

export function storeWorkspaceLinkedInTokensUpdate(
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date,
): Prisma.WorkspaceUpdateInput {
  return {
    linkedInAccessToken: accessToken,
    linkedInRefreshToken: refreshToken,
    linkedInTokenExpiresAt: expiresAt,
    linkedInClerkExternalAccountId: null,
  } as Prisma.WorkspaceUpdateInput;
}

export function bindWorkspaceLinkedInUpdate(
  clerkExternalAccountId: string,
  profileName: string | null,
): Prisma.WorkspaceUpdateInput {
  return {
    linkedInClerkExternalAccountId: clerkExternalAccountId,
    linkedInProfileName: profileName,
  } as Prisma.WorkspaceUpdateInput;
}

export function syncWorkspaceLinkedInUpdate(
  memberId: string,
  profileName: string | null,
  profile: Prisma.InputJsonValue,
): Prisma.WorkspaceUpdateInput {
  return {
    linkedInMemberId: memberId,
    linkedInProfileName: profileName,
    linkedInProfileSyncedAt: new Date(),
    linkedInProfile: profile,
  } as Prisma.WorkspaceUpdateInput;
}

async function loadWorkspaceLinkedIn(
  prisma: {
    workspace: {
      findUniqueOrThrow: (args: {
        where: { id: string };
        select: Prisma.WorkspaceSelect;
      }) => Promise<unknown>;
    };
  },
  workspaceId: string,
): Promise<WorkspaceLinkedInRecord> {
  return (await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: WORKSPACE_LINKEDIN_SELECT,
  })) as WorkspaceLinkedInRecord;
}

export { loadWorkspaceLinkedIn };
