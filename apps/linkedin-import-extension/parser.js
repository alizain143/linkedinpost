/**
 * Parse LinkedIn profile page DOM / embedded JSON (best-effort).
 */

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTruncationMarkers(text) {
  return cleanText(text)
    .replace(/\s*…\s*see more\s*$/i, '')
    .replace(/\s*…\s*more\s*$/i, '')
    .replace(/\s*\.\.\.\s*see more\s*$/i, '')
    .replace(/\s*\.\.\.\s*more\s*$/i, '')
    .replace(/\s*see more\s*$/i, '')
    .trim();
}

const PLACEHOLDER_PATTERNS = [
  /^school$/i,
  /^degree,?\s*field of study$/i,
  /^add education$/i,
  /^add experience$/i,
  /^show your qualifications/i,
  /^show recruiters/i,
  /recruiter inmail/i,
  /^field of study$/i,
  /^tell us about/i,
];

function isPlaceholderText(text) {
  const value = cleanText(text);
  if (!value) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function isMetaLine(line) {
  const value = cleanText(line);
  if (!value) return true;
  return (
    /contact info/i.test(value) ||
    /followers?|connections?/i.test(value) ||
    /^open to/i.test(value) ||
    /^promoted$/i.test(value) ||
    /^·/.test(value) ||
    /^(show all|see all)/i.test(value)
  );
}

function isSkillsLine(line) {
  return /\+\d+\s*skill/i.test(line) || /^skills?:/i.test(line);
}

function isDateLine(line) {
  return (
    /\b(19|20)\d{2}\b/.test(line) &&
    /(present|yr|mos|month|year|–|-)/i.test(line)
  );
}

function findSectionByHeading(...labels) {
  const normalized = labels.map((label) => label.toLowerCase());

  for (const anchorId of ['experience', 'about', 'education', 'skills']) {
    const anchor = document.getElementById(anchorId);
    if (!anchor) continue;
    if (!normalized.some((label) => label.includes(anchorId))) continue;
    const section = anchor.closest('section') || anchor.parentElement;
    if (section) return section;
  }

  const headings = document.querySelectorAll('h1, h2, h3, [role="heading"]');
  for (const heading of headings) {
    const text = cleanText(heading.textContent).toLowerCase();
    if (!text) continue;
    if (!normalized.some((label) => text === label || text.startsWith(`${label} `))) {
      continue;
    }
    return (
      heading.closest('section') ||
      heading.closest('[componentkey]') ||
      heading.parentElement?.parentElement?.parentElement ||
      null
    );
  }

  return null;
}

function linesAfterHeading(headingLabel, stopHeadings) {
  const lines = document.body.innerText
    .split('\n')
    .map(cleanText)
    .filter(Boolean);

  const startIdx = lines.findIndex(
    (line) => line.toLowerCase() === headingLabel.toLowerCase(),
  );
  if (startIdx === -1) return [];

  const stop = new Set(stopHeadings.map((h) => h.toLowerCase()));
  const result = [];
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (stop.has(lines[i].toLowerCase())) break;
    result.push(lines[i]);
  }
  return result;
}

function getProfileTopCard() {
  const h1 = document.querySelector('main h1') || document.querySelector('h1');
  if (!h1) return null;

  for (const section of document.querySelectorAll('main section, main [componentkey]')) {
    if (section.contains(h1)) return section;
  }

  return h1.closest('section') || h1.closest('[componentkey]') || h1.parentElement;
}

function isFeedOrPostContent(el) {
  return Boolean(
    el.closest(
      [
        '.feed-shared-update-v2',
        '.update-components-text',
        '.feed-shared-actor',
        '[data-view-name*="feed"]',
        '[data-view-name*="activity"]',
        '#activity',
        'section[data-section="activities"]',
        '[componentkey*="Activity"]',
      ].join(', '),
    ),
  );
}

function isProfileExpandLabel(label) {
  const value = String(label || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!value) return false;
  // Feed posts use plain "read more"; profile sections use "see/show more" or "…more".
  if (/^read more$/i.test(value)) return false;
  return /see more|show more|…\s*more|\.\.\.\s*more/.test(value);
}

function clickSeeMoreButtons(root) {
  if (!root) return 0;
  let clicked = 0;

  root.querySelectorAll(
    'button, span[role="button"], .inline-show-more-text__button, [class*="inline-show-more-text"] button, [class*="show-more-less"]',
  ).forEach((el) => {
    if (isFeedOrPostContent(el)) return;

    const label = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''}`;
    if (!isProfileExpandLabel(label)) return;

    try {
      el.click();
      clicked += 1;
    } catch {
      // ignore
    }
  });

  return clicked;
}

async function prepareProfilePageForParsing(sleepFn) {
  const sleep = sleepFn || ((ms) => new Promise((r) => setTimeout(r, ms)));

  if (!/\/in\//i.test(window.location.href)) return;

  await sleep(1200);

  const sectionRoots = [
    getProfileTopCard(),
    findSectionByHeading('About'),
    findSectionByHeading('Experience'),
    findSectionByHeading('Education'),
  ].filter(Boolean);

  for (const root of sectionRoots) {
    try {
      root.scrollIntoView({ block: 'center', behavior: 'auto' });
    } catch {
      // ignore
    }
    await sleep(350);

    for (let pass = 0; pass < 3; pass += 1) {
      const clicked = clickSeeMoreButtons(root);
      await sleep(clicked > 0 ? 500 : 200);
      if (clicked === 0 && pass > 0) break;
    }
  }
}

function parseEmbeddedJsonFields() {
  let headline = null;
  let summary = null;

  for (const node of document.querySelectorAll('code, script[type="application/ld+json"]')) {
    const text = node.textContent?.trim();
    if (!text) continue;

    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        const data = JSON.parse(text);
        const objects = Array.isArray(data) ? data : [data];
        for (const item of objects) {
          if (!item || typeof item !== 'object') continue;
          if (!headline && item.headline) headline = cleanText(item.headline);
          if (!summary && item.summary) summary = cleanText(item.summary);
        }
      } catch {
        // ignore
      }
    }

    const headlineMatch = text.match(/"headline"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (!headline && headlineMatch) {
      try {
        headline = cleanText(JSON.parse(`"${headlineMatch[1]}"`));
      } catch {
        // ignore
      }
    }
  }

  return { headline, summary };
}

function parseHeadline(nameHint) {
  const embedded = parseEmbeddedJsonFields();
  if (embedded.headline) return stripTruncationMarkers(embedded.headline);

  const selectors = [
    '.text-body-medium.break-words',
    '[class*="text-body-medium"]',
    '.pv-text-details__left-panel .text-body-medium',
  ];

  for (const selector of selectors) {
    const text = stripTruncationMarkers(document.querySelector(selector)?.textContent);
    if (text && text !== nameHint) return text;
  }

  const topCard = getProfileTopCard();
  if (topCard) {
    const lines = topCard.innerText.split('\n').map(cleanText).filter(Boolean);
    for (const line of lines.slice(0, 8)) {
      if (line === nameHint || isMetaLine(line)) continue;
      if (line.length >= 4 && line.length <= 200) return stripTruncationMarkers(line);
    }
  }

  return null;
}

function parseAbout(fallbackSummary) {
  let best = fallbackSummary ? stripTruncationMarkers(fallbackSummary) : null;
  const aboutSection = findSectionByHeading('About');

  if (aboutSection) {
    const chunks = [];
    aboutSection
      .querySelectorAll(
        '.inline-show-more-text, .pv-shared-text-with-see-more, [class*="inline-show-more-text"]',
      )
      .forEach((el) => {
        const text = stripTruncationMarkers(el.textContent);
        if (text.length > 30 && !isPlaceholderText(text)) chunks.push(text);
      });

    if (chunks.length > 0) {
      best = chunks.sort((a, b) => b.length - a.length)[0];
    }
  }

  if (!best) {
    const lines = linesAfterHeading('About', [
      'Experience',
      'Education',
      'Skills',
      'Featured',
      'Activity',
    ]);
    const paragraph = lines.find((line) => line.length > 30 && !isPlaceholderText(line));
    if (paragraph) best = stripTruncationMarkers(paragraph);
  }

  return best || null;
}

function parseExperienceDescription(item, lines) {
  const chunks = [...item.querySelectorAll('.inline-show-more-text, .pv-shared-text-with-see-more, [class*="show-more"]')]
    .map((el) => stripTruncationMarkers(el.textContent))
    .filter((text) => text.length > 40 && !isSkillsLine(text));

  if (chunks.length > 0) return chunks.sort((a, b) => b.length - a.length)[0];

  const dateIdx = lines.findIndex(isDateLine);
  const descLines = [];
  for (let i = (dateIdx >= 0 ? dateIdx + 1 : 2); i < lines.length; i += 1) {
    const line = lines[i];
    if (isSkillsLine(line) || isMetaLine(line) || isDateLine(line)) continue;
    if (/^on-site$|^remote$|^hybrid$/i.test(line)) continue;
    if (line.length > 20) descLines.push(line);
  }

  const joined = stripTruncationMarkers(descLines.join(' '));
  return joined.length > 25 ? joined : null;
}

function parseExperienceItems() {
  const section = findSectionByHeading('Experience');
  const positions = [];
  const seen = new Set();

  function pushPosition(entry) {
    const title = cleanText(entry.title);
    if (!title || isPlaceholderText(title)) return;
    const companyName = entry.companyName ? cleanText(entry.companyName) : null;
    const key = `${title}|${companyName || ''}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    positions.push({
      title,
      companyName,
      description: entry.description ? stripTruncationMarkers(entry.description) : null,
      companyPageUrl: null,
      startedOn: null,
      isCurrent: entry.isCurrent ?? positions.length === 0,
    });
  }

  if (section) {
    const items = section.querySelectorAll(
      'li, div[role="listitem"], .pvs-list__paged-list-item',
    );

    items.forEach((item, index) => {
      const lines = item.innerText.split('\n').map(cleanText).filter(Boolean);
      if (lines.length === 0) return;

      const companyLink = item.querySelector('a[href*="/company/"]');
      const titleEl = item.querySelector(
        '.t-bold span[aria-hidden="true"], .hoverable-link-text span[aria-hidden="true"], .t-bold',
      );

      let title = cleanText(titleEl?.textContent) || lines[0];
      let companyName = companyLink ? cleanText(companyLink.textContent) : null;

      if (!companyName) {
        const candidate = lines.find(
          (line, idx) =>
            idx > 0 && line !== title && !isDateLine(line) && !isSkillsLine(line) && line.length < 100,
        );
        if (candidate) companyName = candidate.split('·')[0].trim();
      }

      pushPosition({
        title,
        companyName,
        description: parseExperienceDescription(item, lines),
        isCurrent: index === 0,
      });
    });

    if (positions.length === 0) {
      section.querySelectorAll('a[href*="/company/"]').forEach((link, index) => {
        const companyName = cleanText(link.textContent);
        const container =
          link.closest('li, div[role="listitem"], .pvs-list__paged-list-item') || link.parentElement;
        const lines = cleanText(container?.innerText || '')
          .split('\n')
          .map(cleanText)
          .filter(Boolean);
        const title = lines.find((line) => line !== companyName && !isDateLine(line)) || lines[0];
        pushPosition({
          title,
          companyName,
          description: parseExperienceDescription(container || link, lines),
          isCurrent: index === 0,
        });
      });
    }
  }

  if (positions.length === 0) {
    const lines = linesAfterHeading('Experience', [
      'Education',
      'Skills',
      'Licenses & certifications',
      'Interests',
      'Activity',
    ]);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.length < 2 || line.length > 120 || isSkillsLine(line)) continue;
      if (/^(show all|see all)/i.test(line)) continue;
      const next = lines[i + 1];
      if (next && (isDateLine(next) || /\d{4}/.test(next))) {
        pushPosition({ title: line, companyName: null, description: null, isCurrent: positions.length === 0 });
        i += 1;
      }
    }
  }

  return positions;
}

function parseEducationItems() {
  const section = findSectionByHeading('Education');
  const education = [];
  const seen = new Set();

  if (!section) return education;

  if (!section.querySelector('a[href*="/school/"]')) {
    const text = cleanText(section.innerText);
    if (/add education|degree, field of study|show your qualifications/i.test(text)) {
      return education;
    }
  }

  section.querySelectorAll('li, div[role="listitem"], .pvs-list__paged-list-item').forEach((item) => {
    const schoolLink = item.querySelector('a[href*="/school/"]');
    if (!schoolLink) return;

    const schoolName = cleanText(schoolLink.textContent);
    const degreeEl = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .t-normal span[aria-hidden="true"]');
    let degreeName = cleanText(degreeEl?.textContent) || null;

    if (isPlaceholderText(schoolName)) return;
    if (degreeName && isPlaceholderText(degreeName)) degreeName = null;

    const key = `${schoolName}|${degreeName || ''}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    education.push({ schoolName, degreeName, fieldOfStudy: null });
  });

  return education;
}

function parseSkillsItems() {
  const section = findSectionByHeading('Skills');
  if (!section) return [];

  const skills = [];
  const seen = new Set();

  section.querySelectorAll('a[href*="/skill/"], .t-bold span[aria-hidden="true"]').forEach((el) => {
    const name = cleanText(el.textContent);
    if (!name || isPlaceholderText(name) || seen.has(name.toLowerCase())) return;
    if (name.length < 2 || name.length > 80) return;
    seen.add(name.toLowerCase());
    skills.push(name);
  });

  return skills.slice(0, 20);
}

function mergeProfiles(primary, secondary) {
  const pickLonger = (a, b) => {
    if (!a) return b || null;
    if (!b) return a || null;
    return a.length >= b.length ? a : b;
  };

  const pickMore = (a, b) => ((a?.length || 0) >= (b?.length || 0) ? a || [] : b || []);

  return {
    profileUrl: primary.profileUrl || secondary.profileUrl,
    headline: primary.headline || secondary.headline,
    summary: pickLonger(primary.summary, secondary.summary),
    positions: pickMore(primary.positions, secondary.positions),
    education: pickMore(primary.education, secondary.education),
    skills: pickMore(primary.skills, secondary.skills),
  };
}

function parseLinkedInProfile() {
  const profileUrl = window.location.href.split('?')[0];
  const embedded = parseEmbeddedJsonFields();
  const nameHint = cleanText(
    (document.querySelector('main h1') || document.querySelector('h1'))?.textContent,
  );

  return {
    profileUrl,
    headline: parseHeadline(nameHint),
    summary: parseAbout(embedded.summary),
    positions: parseExperienceItems(),
    education: parseEducationItems(),
    skills: parseSkillsItems(),
  };
}

function getParseDiagnostics() {
  return {
    pageUrl: window.location.pathname,
    onProfilePage: /\/in\//i.test(window.location.href),
    h1Count: document.querySelectorAll('h1').length,
    bodyLines: document.body.innerText.split('\n').filter(Boolean).length,
    hasExperienceSection: Boolean(findSectionByHeading('Experience')),
    hasAboutSection: Boolean(findSectionByHeading('About')),
    hasHeadlineEl: Boolean(document.querySelector('[class*="text-body-medium"]')),
    readyState: document.readyState,
  };
}

if (typeof window !== 'undefined') {
  window.parseLinkedInProfile = parseLinkedInProfile;
  window.getParseDiagnostics = getParseDiagnostics;
  window.prepareProfilePageForParsing = prepareProfilePageForParsing;
  window.mergeProfiles = mergeProfiles;
}
