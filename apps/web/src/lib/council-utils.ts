import type { GenerationJobStatus } from "@/lib/api/types/enums";

const AGENT_ROLE_LABELS: Record<string, string> = {
  writer: "Writer",
  reviewer: "Reviewer",
  editor: "Editor",
  image_scout: "Image Scout",
  media_creator: "Media Creator",
  media_reviewer: "Media Reviewer",
};

export function formatAgentRole(role: string): string {
  return AGENT_ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function isTerminalJobStatus(status: GenerationJobStatus): boolean {
  return status === "completed" || status === "failed";
}

export function shouldPollJob(status: GenerationJobStatus | undefined): boolean {
  return status === "pending" || status === "running";
}
