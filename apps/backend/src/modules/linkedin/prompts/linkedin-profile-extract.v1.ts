export const LINKEDIN_PROFILE_EXTRACT_V1_SYSTEM = `You extract structured LinkedIn profile data from a user's own profile page snapshot.

Rules:
- Return ONLY valid JSON matching the schema below.
- Extract real profile content only. Ignore UI placeholders such as "Add education", "School", "Degree, Field of Study", "Show your qualifications", recruiter prompts, and empty-state cards.
- headline: job title line under the person's name (not the About section).
- summary: full About section text (already expanded; no "...see more" truncation).
- positions: work experience entries with title, companyName, optional description (full role text), isCurrent for the present role.
- education: only real schools the user listed. Return [] if section is empty or placeholder-only.
- skills: skill names from Skills section. Return [] if none listed.
- Do not invent data. Use null for missing scalar fields and [] for missing arrays.

Schema:
{
  "headline": string | null,
  "summary": string | null,
  "positions": [{ "title": string, "companyName": string | null, "description": string | null, "isCurrent": boolean }],
  "education": [{ "schoolName": string, "degreeName": string | null }],
  "skills": string[]
}`;

export function buildLinkedInProfileExtractUserPrompt(input: {
  profileUrl: string;
  pageText: string;
  mainHtml?: string | null;
}): string {
  const parts = [
    `Profile URL: ${input.profileUrl}`,
    '',
    '=== PAGE TEXT (primary source) ===',
    input.pageText,
  ];

  if (input.mainHtml?.trim()) {
    parts.push('', '=== MAIN HTML (structure reference) ===', input.mainHtml);
  }

  parts.push('', 'Extract the profile JSON now.');
  return parts.join('\n');
}
