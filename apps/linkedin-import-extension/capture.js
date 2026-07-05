/**
 * Capture a sanitized LinkedIn profile snapshot for server-side extraction.
 * No CSS selectors for headline/experience — just DOM/text capture.
 */

function sanitizeHtmlRoot(root) {
  if (!root) return '';

  const clone = root.cloneNode(true);
  clone
    .querySelectorAll(
      'script, style, svg, noscript, iframe, link[rel="stylesheet"], img, video, canvas',
    )
    .forEach((el) => el.remove());

  clone.querySelectorAll('[hidden]').forEach((el) => el.remove());

  return clone.innerHTML || '';
}

function captureProfileSnapshot() {
  const profileUrl = window.location.href.split('?')[0];
  const root =
    document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.body;

  let mainHtml = sanitizeHtmlRoot(root);
  let pageText = root?.innerText || document.body.innerText || '';

  const MAX_HTML = 500_000;
  const MAX_TEXT = 100_000;

  if (mainHtml.length > MAX_HTML) {
    mainHtml = mainHtml.slice(0, MAX_HTML);
  }
  if (pageText.length > MAX_TEXT) {
    pageText = pageText.slice(0, MAX_TEXT);
  }

  return {
    profileUrl,
    mainHtml,
    pageText,
    capturedAt: new Date().toISOString(),
  };
}

if (typeof window !== 'undefined') {
  window.captureProfileSnapshot = captureProfileSnapshot;
}
