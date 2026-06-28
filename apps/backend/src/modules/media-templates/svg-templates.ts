function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

export interface BrandedQuoteCardSvgInput {
  profileName: string;
  roleTitle?: string;
  headlineText: string;
  ctaFooter?: string;
  brandPrimary?: string;
  brandAccent?: string;
  variant?: 'dark' | 'light';
}

export interface EducationalPostSvgInput {
  profileName: string;
  roleTitle?: string;
  headlineText: string;
  accentPhrase?: string;
  supportingLine?: string;
  footerTags?: string;
  ctaFooter?: string;
  flowSteps?: string[];
  brandAccent?: string;
}

function buildInitialsAvatar(name: string, x: number, y: number): string {
  const initial = escapeXml(name.trim().charAt(0).toUpperCase() || 'A');
  return `
  <circle cx="${x + 20}" cy="${y + 20}" r="20" fill="#e2e8f0"/>
  <text x="${x + 20}" y="${y + 27}" fill="#334155" font-family="Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle">${initial}</text>`;
}

export function buildEducationalPostSvg(input: EducationalPostSvgInput): string {
  const accent = input.brandAccent ?? '#2563eb';
  const bg = '#f4f4ef';
  const headline = escapeXml(input.headlineText);
  const accentPhrase = escapeXml(input.accentPhrase ?? '');
  const supporting = escapeXml(
    input.supportingLine ?? 'A practical takeaway for your LinkedIn feed.',
  );
  const footerTags = escapeXml(
    input.footerTags ?? 'Insights | Strategy | Growth',
  );
  const cta = escapeXml(input.ctaFooter ?? 'Save & Repost');
  const steps = (input.flowSteps ?? ['Problem', 'Solution', 'Outcome']).slice(
    0,
    3,
  );

  const stepBoxes = steps
    .map((step, index) => {
      const x = 280 + index * 220;
      return `
      <rect x="${x}" y="340" width="160" height="100" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
      <circle cx="${x + 80}" cy="375" r="18" fill="${accent}" opacity="0.15"/>
      <text x="${x + 80}" y="382" fill="${accent}" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle">${index + 1}</text>
      <text x="${x + 80}" y="415" fill="#334155" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">${escapeXml(step)}</text>
      ${index < steps.length - 1 ? `<text x="${x + 175}" y="395" fill="${accent}" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">→</text>` : ''}`;
    })
    .join('');

  const headlineWithAccent = accentPhrase
    ? `${headline} <tspan fill="${accent}">${accentPhrase}</tspan>`
    : headline;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${bg}"/>
  <rect width="1200" height="630" fill="url(#grain)" opacity="0.35"/>
  <defs>
    <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.6" fill="#000000" opacity="0.04"/>
    </pattern>
  </defs>
  ${buildInitialsAvatar(input.profileName, 48, 36)}
  <text x="100" y="66" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(input.profileName)}</text>
  <text x="1152" y="66" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="end">${escapeXml(input.roleTitle ?? '')}</text>
  <text x="600" y="175" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" text-anchor="middle">${headlineWithAccent}</text>
  <text x="600" y="225" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="22" text-anchor="middle">${supporting}</text>
  ${stepBoxes}
  <line x1="48" y1="580" x2="1152" y2="580" stroke="#e2e8f0"/>
  <text x="48" y="610" fill="#334155" font-family="Arial, sans-serif" font-size="16">${footerTags}</text>
  <text x="1152" y="610" fill="#334155" font-family="Arial, sans-serif" font-size="16" text-anchor="end">${cta}</text>
</svg>`;
}

export function buildBrandedQuoteCardSvg(input: BrandedQuoteCardSvgInput): string {
  if (input.variant === 'light') {
    return buildLightQuoteCardSvg(input);
  }
  const primary = input.brandPrimary ?? '#1a1a2e';
  const accent = input.brandAccent ?? '#5B3DF5';
  const lines = wrapText(input.headlineText, 42, 4);
  const quoteLines = lines
    .map(
      (line, index) =>
        `<tspan x="80" dy="${index === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="72" fill="#000000" opacity="0.25"/>
  <text x="40" y="46" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(input.profileName)}</text>
  <text x="1160" y="46" fill="#e0e0e0" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="end">${escapeXml(input.roleTitle ?? '')}</text>
  <text x="80" y="280" fill="#ffffff" font-family="Georgia, serif" font-size="38" font-weight="700">${quoteLines}</text>
  <rect x="0" y="558" width="1200" height="72" fill="#000000" opacity="0.35"/>
  <text x="600" y="604" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" letter-spacing="2">${escapeXml(input.ctaFooter ?? 'Repost · Comment · Share')}</text>
</svg>`;
}

function buildLightQuoteCardSvg(input: BrandedQuoteCardSvgInput): string {
  const accent = input.brandAccent ?? '#5B3DF5';
  const lines = wrapText(input.headlineText, 38, 4);
  const quoteLines = lines
    .map(
      (line, index) =>
        `<tspan x="600" dy="${index === 0 ? 0 : 42}" text-anchor="middle">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#fafaf8"/>
  ${buildInitialsAvatar(input.profileName, 48, 36)}
  <text x="100" y="66" fill="#0f172a" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(input.profileName)}</text>
  <text x="1152" y="66" fill="#475569" font-family="Arial, sans-serif" font-size="18" text-anchor="end">${escapeXml(input.roleTitle ?? '')}</text>
  <text x="600" y="300" fill="#0f172a" font-family="Georgia, serif" font-size="40" font-weight="700" text-anchor="middle">${quoteLines}</text>
  <line x1="48" y1="580" x2="1152" y2="580" stroke="#e2e8f0"/>
  <text x="48" y="610" fill="#64748b" font-family="Arial, sans-serif" font-size="16">${escapeXml(input.profileName)}</text>
  <text x="1152" y="610" fill="${accent}" font-family="Arial, sans-serif" font-size="16" font-weight="600" text-anchor="end">${escapeXml(input.ctaFooter ?? 'Save & Repost')}</text>
</svg>`;
}

export interface StatHighlightSvgInput {
  profileName: string;
  roleTitle?: string;
  statValue: string;
  statLabel: string;
  brandPrimary?: string;
  brandAccent?: string;
}

export function buildStatHighlightSvg(input: StatHighlightSvgInput): string {
  const primary = input.brandPrimary ?? '#0f172a';
  const accent = input.brandAccent ?? '#5B3DF5';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${primary}"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="${accent}" opacity="0.15"/>
  <text x="80" y="110" fill="#94a3b8" font-family="Arial, sans-serif" font-size="20">${escapeXml(input.profileName)}${input.roleTitle ? ` · ${escapeXml(input.roleTitle)}` : ''}</text>
  <text x="600" y="320" fill="#ffffff" font-family="Arial, sans-serif" font-size="120" font-weight="800" text-anchor="middle">${escapeXml(input.statValue)}</text>
  <text x="600" y="400" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">${escapeXml(input.statLabel)}</text>
</svg>`;
}

export interface TipCardSvgInput {
  profileName: string;
  roleTitle?: string;
  tips: string[];
  brandPrimary?: string;
  brandAccent?: string;
}

export function buildTipCardSvg(input: TipCardSvgInput): string {
  const primary = input.brandPrimary ?? '#111827';
  const accent = input.brandAccent ?? '#5B3DF5';
  const tips = input.tips.slice(0, 5);
  const tipMarkup = tips
    .map(
      (tip, index) =>
        `<text x="100" y="${200 + index * 72}" fill="#f8fafc" font-family="Arial, sans-serif" font-size="26">
          <tspan fill="${accent}" font-weight="700">${index + 1}. </tspan>${escapeXml(tip)}
        </text>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${primary}"/>
  <text x="60" y="80" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(input.profileName)}</text>
  <text x="1140" y="80" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18" text-anchor="end">${escapeXml(input.roleTitle ?? '')}</text>
  ${tipMarkup}
</svg>`;
}
