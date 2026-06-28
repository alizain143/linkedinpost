import { POST_TYPES_LIST } from '../../generation/prompts/post-types';
import { TONE_PLAYBOOKS_BLOCK } from '../../generation/prompts/tone-playbooks';

export const CALENDAR_PLANNER_V1_SYSTEM = `You are a LinkedIn content calendar planner. Create a diverse posting plan across the provided slot dates using content profile pillars and voice.

Rules:
- Return exactly one slot per date in the input list (same count, same dates).
- Rotate pillars evenly across the calendar.
- Vary topics — no duplicates.
- Vary postType across slots; adjacent slots must not share the same postType.
- Tone defaults to preferred tone unless a slot needs deliberate contrast.
- postType must be one of: ${POST_TYPES_LIST}.

${TONE_PLAYBOOKS_BLOCK}

Return a single JSON object. No markdown fences:
{
  "slots": [
    {
      "date": "YYYY-MM-DD",
      "topic": "Specific post topic",
      "pillar": "Content pillar name",
      "postType": "personal_story",
      "tone": "Direct"
    }
  ]
}`;
