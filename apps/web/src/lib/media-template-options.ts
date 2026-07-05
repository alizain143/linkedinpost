import type { MediaTemplatesListResponse } from "@/lib/api/types/media-template";

export function buildMediaTemplateSelectOptions(
  data: MediaTemplatesListResponse | undefined,
): { value: string; label: string }[] {
  if (!data) return [];

  const presetOptions = data.presets.map((preset) => ({
    value: preset.id,
    label: preset.name,
  }));

  const templateOptions = data.templates.map((template) => ({
    value: template.id,
    label: template.isWorkspaceDefault
      ? `${template.name} (Default)`
      : template.name,
  }));

  return [...presetOptions, ...templateOptions];
}

export function resolveDefaultMediaTemplateId(
  data: MediaTemplatesListResponse | undefined,
): string {
  if (!data) return "";

  if (data.defaultMediaTemplateId) {
    return data.defaultMediaTemplateId;
  }

  const defaultWorkspace = data.templates.find((t) => t.isWorkspaceDefault);
  if (defaultWorkspace) return defaultWorkspace.id;

  if (data.templates[0]) return data.templates[0].id;

  return "";
}

export function isPresetTemplateSelection(value: string): boolean {
  return value.startsWith("preset:");
}

export function presetIdFromSelection(value: string): string {
  return value.replace(/^preset:/, "");
}