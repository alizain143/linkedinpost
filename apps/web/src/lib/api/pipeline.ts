import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiPipelineResponse,
  PipelineParams,
} from "@/lib/api/types/pipeline";

function buildPipelineQuery(params?: PipelineParams): string {
  if (!params?.limitPerColumn) return "";
  return `?limitPerColumn=${params.limitPerColumn}`;
}

export async function fetchPipeline(
  token: string,
  workspaceId: string,
  params?: PipelineParams,
): Promise<ApiPipelineResponse> {
  return apiFetch<ApiPipelineResponse>(
    token,
    `/workspaces/${workspaceId}/pipeline${buildPipelineQuery(params)}`,
  );
}
