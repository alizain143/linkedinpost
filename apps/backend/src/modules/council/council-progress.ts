import { GenerationJobProgress } from '../generation/generation.types';

const BASE_TOTAL_STEPS = 7;

export function computeCouncilProgress(
  completedSteps: number,
  currentStep: string,
  currentLabel: string,
  totalSteps = BASE_TOTAL_STEPS,
): GenerationJobProgress {
  const percentComplete = Math.min(
    100,
    Math.round((completedSteps / totalSteps) * 100),
  );

  return {
    currentStep,
    currentLabel,
    completedSteps,
    totalSteps,
    percentComplete,
  };
}

export function councilTotalSteps(
  maxTextRevisions: number,
  maxMediaRegens: number,
  includeImageScout = true,
): number {
  const base = includeImageScout ? 6 : 5;
  return base + maxTextRevisions * 2 + maxMediaRegens * 2;
}
