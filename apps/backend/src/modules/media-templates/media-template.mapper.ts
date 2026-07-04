import { MediaTemplate } from '@prisma/client';
import { parseMediaTemplateLayout } from './layout.validator';
import {
  MediaTemplateLayout,
  ResolvedMediaTemplate,
} from './layout.types';

export interface MediaTemplateResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
  isSystem: boolean;
  isWorkspaceDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toMediaTemplateResponse(
  row: MediaTemplate,
  options?: { isWorkspaceDefault?: boolean },
): MediaTemplateResponse {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
    layout: parseMediaTemplateLayout(row.layout),
    isSystem: row.isSystem,
    isWorkspaceDefault: options?.isWorkspaceDefault ?? false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toResolvedFromRow(
  row: MediaTemplate,
): ResolvedMediaTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
    layout: parseMediaTemplateLayout(row.layout),
    isSystem: row.isSystem,
    workspaceId: row.workspaceId,
  };
}
