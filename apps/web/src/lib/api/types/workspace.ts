import type { WorkspaceType } from "./enums";

export type ApiWorkspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiWorkspaceStats = {
  draftCount: number;
  scheduledCount: number;
  hasDefaultProfile: boolean;
};

export type ApiWorkspaceDetail = ApiWorkspace & {
  stats: ApiWorkspaceStats;
};

export type ClientWorkspaceProfileBody = {
  industry?: string;
  targetAudience?: string;
  roleTitle?: string;
  pillars?: string[];
};

export type CreateClientWorkspaceBody = {
  name: string;
  profile?: ClientWorkspaceProfileBody;
};

export type UpdateClientWorkspaceBody = {
  name: string;
};

export type DeleteClientWorkspaceResponse = {
  deleted: true;
};
