import { QUICK_DRAFT_V1_SYSTEM } from './quick-draft.v1.system';
import { QUICK_DRAFT_V1_USER } from './quick-draft.v1.user';
import { QUICK_DRAFT_SINGLE_V1_SYSTEM } from './quick-draft-single.v1.system';
import { QUICK_DRAFT_SINGLE_V1_USER } from './quick-draft-single.v1.user';
import { COUNCIL_WRITER_V1_SYSTEM } from './council-writer.v1.system';
import { COUNCIL_WRITER_V1_USER } from './council-writer.v1.user';
import { COUNCIL_REVIEWER_V1_SYSTEM } from './council-reviewer.v1.system';
import { COUNCIL_REVIEWER_V1_USER } from './council-reviewer.v1.user';
import { COUNCIL_EDITOR_V1_SYSTEM } from './council-editor.v1.system';
import { COUNCIL_EDITOR_V1_USER } from './council-editor.v1.user';
import { COUNCIL_MEDIA_CREATOR_V1_SYSTEM } from './council-media-creator.v1.system';
import { COUNCIL_MEDIA_CREATOR_V1_USER } from './council-media-creator.v1.user';
import { COUNCIL_MEDIA_REVIEWER_V1_SYSTEM } from './council-media-reviewer.v1.system';
import { COUNCIL_MEDIA_REVIEWER_V1_USER } from './council-media-reviewer.v1.user';
import { CALENDAR_PLANNER_V1_SYSTEM } from '../../calendar-generation/prompts/calendar-planner.v1.system';
import { CALENDAR_PLANNER_V1_USER } from '../../calendar-generation/prompts/calendar-planner.v1.user';
import { TOPIC_SUGGESTIONS_V1_SYSTEM } from './topic-suggestions.v1.system';
import { TOPIC_SUGGESTIONS_V1_USER } from './topic-suggestions.v1.user';
import { REVISE_DRAFT_V1_SYSTEM } from './revise-draft.v1.system';
import { REVISE_DRAFT_V1_USER } from './revise-draft.v1.user';
import { COMPARE_PICK_V1_SYSTEM } from './compare-pick.v1.system';
import { COMPARE_PICK_V1_USER } from './compare-pick.v1.user';

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
  'quick-draft-single': {
    id: 'quick-draft-single',
    version: 1,
    system: QUICK_DRAFT_SINGLE_V1_SYSTEM,
    user: QUICK_DRAFT_SINGLE_V1_USER,
  },
  'council-writer': {
    id: 'council-writer',
    version: 1,
    system: COUNCIL_WRITER_V1_SYSTEM,
    user: COUNCIL_WRITER_V1_USER,
  },
  'council-reviewer': {
    id: 'council-reviewer',
    version: 1,
    system: COUNCIL_REVIEWER_V1_SYSTEM,
    user: COUNCIL_REVIEWER_V1_USER,
  },
  'council-editor': {
    id: 'council-editor',
    version: 1,
    system: COUNCIL_EDITOR_V1_SYSTEM,
    user: COUNCIL_EDITOR_V1_USER,
  },
  'council-media-creator': {
    id: 'council-media-creator',
    version: 1,
    system: COUNCIL_MEDIA_CREATOR_V1_SYSTEM,
    user: COUNCIL_MEDIA_CREATOR_V1_USER,
  },
  'council-media-reviewer': {
    id: 'council-media-reviewer',
    version: 1,
    system: COUNCIL_MEDIA_REVIEWER_V1_SYSTEM,
    user: COUNCIL_MEDIA_REVIEWER_V1_USER,
  },
  'calendar-planner': {
    id: 'calendar-planner',
    version: 1,
    system: CALENDAR_PLANNER_V1_SYSTEM,
    user: CALENDAR_PLANNER_V1_USER,
  },
  'topic-suggestions': {
    id: 'topic-suggestions',
    version: 1,
    system: TOPIC_SUGGESTIONS_V1_SYSTEM,
    user: TOPIC_SUGGESTIONS_V1_USER,
  },
  'revise-draft': {
    id: 'revise-draft',
    version: 1,
    system: REVISE_DRAFT_V1_SYSTEM,
    user: REVISE_DRAFT_V1_USER,
  },
  'compare-pick': {
    id: 'compare-pick',
    version: 1,
    system: COMPARE_PICK_V1_SYSTEM,
    user: COMPARE_PICK_V1_USER,
  },
};

export function getPromptTemplate(id: string, version = 1): PromptTemplate {
  const template = PROMPT_REGISTRY[id];

  if (!template || template.version !== version) {
    throw new Error(`Prompt template not found: ${id} v${version}`);
  }

  return template;
}
