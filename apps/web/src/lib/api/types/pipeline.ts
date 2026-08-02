import type {
  PostPackageStatus,
  PostSource,
  PostType,
} from "@/lib/api/types/enums";
import type { ApiPostMedia } from "@/lib/api/types/post";

export type ApiPostPackageSummary = {
  id: string;
  hook: string;
  pillar: string | null;
  postType: PostType | null;
  source: PostSource;
  status: PostPackageStatus;
  score: number | null;
  scheduledAt: string | null;
  updatedAt: string;
  media: ApiPostMedia[];
};

export type ApiPipelineColumn = {
  status: PostPackageStatus;
  label: string;
  count: number;
  posts: ApiPostPackageSummary[];
};

export type ApiPipelineResponse = {
  columns: ApiPipelineColumn[];
};

export type PipelineParams = {
  limitPerColumn?: number;
};
