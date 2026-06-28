import type { GenerationJobStatus } from "@/lib/api/types/enums";
import type { CouncilEvent } from "@/lib/api/types/generation";

export type ApiCouncilRun = {
  id: string;
  generationJobId: string;
  status: GenerationJobStatus;
  finalScore: number | null;
  revisionCount: number;
  mediaRegenCount: number;
  createdAt: string;
  completedAt: string | null;
  events: CouncilEvent[];
};

export type ApiCouncilTimeline = {
  postPackageId: string;
  runs: ApiCouncilRun[];
};
