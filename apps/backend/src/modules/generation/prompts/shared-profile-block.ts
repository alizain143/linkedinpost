export interface ProfileBlockFields {
  name: string;
  roleTitle: string;
  industry: string;
  targetAudience: string;
  contentGoal: string;
  preferredTone: string;
  offerDescription: string;
  writingSample: string;
  avoidWords: string;
  pillars: string;
}

export function buildProfileBlock(fields: ProfileBlockFields): string {
  return `<profile>
${fields.name}|${fields.roleTitle}|${fields.industry}|${fields.targetAudience}|${fields.contentGoal}|${fields.preferredTone}|${fields.offerDescription}|${fields.avoidWords}|${fields.pillars}
writing_sample: ${fields.writingSample}
</profile>`;
}

export function buildMinimalProfileBlock(fields: {
  name: string;
  writingSample: string;
  avoidWords: string;
}): string {
  return `<profile>
${fields.name}|${fields.avoidWords}
writing_sample: ${fields.writingSample}
</profile>`;
}

export function buildMediaProfileBlock(fields: {
  name: string;
  roleTitle: string;
  industry: string;
  preferredTone: string;
  brandPrimary: string;
  brandAccent: string;
  avoidWords: string;
}): string {
  return `<profile>
${fields.name}|${fields.roleTitle}|${fields.industry}|${fields.preferredTone}
brandPrimary: ${fields.brandPrimary}
brandAccent: ${fields.brandAccent}
avoidWords: ${fields.avoidWords}
</profile>`;
}

export function buildBriefBlock(fields: {
  topic: string;
  postType: string;
  tone: string;
  pillar: string;
  brief: string;
  additionalContext: string;
}): string {
  return `<brief>
${fields.topic}|${fields.postType}|${fields.tone}|${fields.pillar}
brief: ${fields.brief}
context: ${fields.additionalContext}
</brief>`;
}

export function buildRequestBlock(fields: {
  topic: string;
  postType: string;
  tone: string;
  pillar: string;
  additionalContext: string;
  documentsLine: string;
}): string {
  const documents = fields.documentsLine
    ? `\n${fields.documentsLine}`
    : '';

  return `<request>
${fields.topic}|${fields.postType}|${fields.tone}|${fields.pillar}
context: ${fields.additionalContext}${documents}
</request>`;
}

export function buildRevisionBlock(fields: {
  previousHook?: string;
  previousBody?: string;
  previousCta?: string;
  previousTags?: string[];
  revisionPrompt?: string;
  approvalFeedback?: string;
}): string {
  const hasPrevious =
    !!fields.previousHook ||
    !!fields.previousBody ||
    !!fields.previousCta ||
    (fields.previousTags?.length ?? 0) > 0;
  const hasFeedback =
    !!fields.revisionPrompt?.trim() || !!fields.approvalFeedback?.trim();

  if (!hasPrevious && !hasFeedback) {
    return '';
  }

  const parts: string[] = ['<revision>'];
  if (hasPrevious) {
    parts.push('previous_draft:');
    if (fields.previousHook) parts.push(`hook: ${fields.previousHook}`);
    if (fields.previousBody) parts.push(`body: ${fields.previousBody}`);
    if (fields.previousCta) parts.push(`cta: ${fields.previousCta}`);
    if (fields.previousTags?.length) {
      parts.push(`tags: ${fields.previousTags.join(', ')}`);
    }
  }
  if (fields.approvalFeedback?.trim()) {
    parts.push(`approval_feedback: ${fields.approvalFeedback.trim()}`);
  }
  if (fields.revisionPrompt?.trim()) {
    parts.push(`revision_notes: ${fields.revisionPrompt.trim()}`);
  }
  parts.push('</revision>');
  return parts.join('\n');
}

export function buildPostBlock(fields: {
  hook: string;
  body: string;
  cta: string;
}): string {
  return `<post>
hook: ${fields.hook}
body: ${fields.body}
cta: ${fields.cta}
</post>`;
}
