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
