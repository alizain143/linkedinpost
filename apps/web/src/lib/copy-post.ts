export function formatPostPlainText(parts: {
  hook: string;
  body?: string | null;
  cta?: string | null;
  tags?: string[];
}): string {
  const blocks = [parts.hook.trim()];
  if (parts.body?.trim()) blocks.push(parts.body.trim());
  if (parts.cta?.trim()) blocks.push(parts.cta.trim());
  if (parts.tags?.length) {
    blocks.push(parts.tags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" "));
  }
  return blocks.join("\n\n");
}

export async function copyPostToClipboard(parts: {
  hook: string;
  body?: string | null;
  cta?: string | null;
  tags?: string[];
}): Promise<void> {
  const text = formatPostPlainText(parts);
  await navigator.clipboard.writeText(text);
}
