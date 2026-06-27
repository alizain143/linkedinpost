import { GenerationJobType } from '@prisma/client';

export interface JobHandler {
  readonly type: GenerationJobType;
  handle(generationJobId: string): Promise<void>;
}
