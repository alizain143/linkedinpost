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
  avoidVariantsBlock?: string;
}): string {
  const hasPrevious =
    !!fields.previousHook ||
    !!fields.previousBody ||
    !!fields.previousCta ||
    (fields.previousTags?.length ?? 0) > 0;
  const hasFeedback =
    !!fields.revisionPrompt?.trim() || !!fields.approvalFeedback?.trim();
  const hasAvoid = !!fields.avoidVariantsBlock?.trim();

  if (!hasPrevious && !hasFeedback && !hasAvoid) {
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
  if (hasAvoid) {
    parts.push(fields.avoidVariantsBlock!.trim());
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

export interface AvoidVariantFields {
  hook: string;
  body: string;
  cta: string;
  tags: string[];
}

export function buildAvoidVariantsBlock(
  variants: AvoidVariantFields[],
  limits: {
    maxVariants: number;
    hookMax: number;
    bodyMax: number;
  },
): string {
  if (variants.length === 0) {
    return '';
  }

  const parts = [
    'avoid_variants (do NOT reproduce, paraphrase, or cycle back to any of these):',
  ];

  variants.slice(0, limits.maxVariants).forEach((variant, index) => {
    parts.push(`variant_${index + 1}:`);
    if (variant.hook) {
      parts.push(
        `hook: ${truncateAvoidText(variant.hook, limits.hookMax)}`,
      );
    }
    if (variant.body) {
      parts.push(
        `body: ${truncateAvoidText(variant.body, limits.bodyMax)}`,
      );
    }
    if (variant.cta) {
      parts.push(`cta: ${variant.cta}`);
    }
    if (variant.tags.length) {
      parts.push(`tags: ${variant.tags.join(', ')}`);
    }
  });

  return parts.join('\n');
}

function truncateAvoidText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
