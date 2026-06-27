import { getPromptTemplate } from '../generation/prompts/prompt-registry';

export const COUNCIL_FLOW_IDS = [
  'council-writer',
  'council-reviewer',
  'council-editor',
  'council-media-creator',
  'council-media-reviewer',
] as const;

export type CouncilFlowId = (typeof COUNCIL_FLOW_IDS)[number];

export function getCouncilPromptTemplate(flowId: CouncilFlowId) {
  return getPromptTemplate(flowId, 1);
}
