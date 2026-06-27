import { QUICK_DRAFT_V1_SYSTEM } from './quick-draft.v1.system';
import { QUICK_DRAFT_V1_USER } from './quick-draft.v1.user';

export interface PromptTemplate {
  id: string;
  version: number;
  system: string;
  user: string;
}

export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  'quick-draft': {
    id: 'quick-draft',
    version: 1,
    system: QUICK_DRAFT_V1_SYSTEM,
    user: QUICK_DRAFT_V1_USER,
  },
};

export function getPromptTemplate(
  id: string,
  version = 1,
): PromptTemplate {
  const template = PROMPT_REGISTRY[id];

  if (!template || template.version !== version) {
    throw new Error(`Prompt template not found: ${id} v${version}`);
  }

  return template;
}
