export const COUNCIL_WRITER_V1_USER = `Write a LinkedIn post draft.

Creator: {{user.displayName}}
Content profile: {{contentProfile.name}}
Role: {{contentProfile.roleTitle}}
Industry: {{contentProfile.industry}}
Audience: {{contentProfile.targetAudience}}
Goal: {{contentProfile.contentGoal}}
Tone: {{contentProfile.preferredTone}}
Writing sample: {{contentProfile.writingSample}}
Avoid: {{contentProfile.avoidWords}}
Pillars: {{contentProfile.pillars}}

Topic: {{input.topic}}
Post type: {{input.postType}}
Requested tone: {{input.tone}}
Pillar: {{input.pillar}}
Brief: {{input.brief}}
Context: {{input.additionalContext}}

Prior council steps:
{{priorSteps.json}}

If revision feedback is present in prior steps, apply it.`;
