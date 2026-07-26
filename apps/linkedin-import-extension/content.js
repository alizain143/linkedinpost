(function () {
  const progress = () => window.lpImportProgress;

  const params = new URLSearchParams(window.location.search);
  const importToken = params.get('lp_import');
  const workspaceId = params.get('lp_workspace');

  if (importToken) {
    chrome.storage.local.set({ lp_import_token: importToken });
  }
  if (workspaceId) {
    chrome.storage.local.set({ lp_workspace_id: workspaceId });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'PARSE_PROFILE') {
      try {
        const data =
          typeof captureProfileSnapshot === 'function'
            ? captureProfileSnapshot()
            : { profileUrl: window.location.href.split('?')[0] };
        sendResponse({ ok: true, data });
      } catch (err) {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : 'Capture failed',
        });
      }
      return true;
    }

    if (message.type === 'LP_IMPORT_PROGRESS') {
      progress()?.setStep(message.step || 'returning');
      if (message.step === 'done') {
        window.setTimeout(() => progress()?.hide(), 600);
      }
      return false;
    }

    if (message.type === 'LP_IMPORT_EXTRACT_ERROR') {
      progress()?.setError(message.error || 'Profile extraction failed');
      window.setTimeout(() => progress()?.hide(), 2500);
      return false;
    }

    return false;
  });

  chrome.storage.local.get(
    [
      'lp_import_token',
      'lp_workspace_id',
      'lp_api_base',
      'lp_return_url',
      'lp_import_session_expires',
      'lp_auto_import_done',
      'lp_expected_profile_slug',
      'lp_expected_profile_name',
    ],
    (stored) => {
      const expires = stored.lp_import_session_expires || 0;
      if (!stored.lp_import_token || Date.now() > expires) return;
      if (stored.lp_auto_import_done) return;

      progress()?.show('checking');
      progress()?.setRetryHandler(() => {
        chrome.storage.local.set({ lp_auto_import_done: false }, () => {
          progress()?.show('checking');
          void runImportFlow(stored);
        });
      });
      void runImportFlow(stored);
    },
  );

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function profileSlugFromUrl(url) {
    try {
      const match = new URL(url).pathname.match(/\/in\/([^/?#]+)/i);
      if (!match?.[1]) return null;
      return decodeURIComponent(match[1]).toLowerCase().replace(/\/+$/, '');
    } catch {
      const match = String(url).match(/\/in\/([^/?#]+)/i);
      if (!match?.[1]) return null;
      try {
        return decodeURIComponent(match[1]).toLowerCase().replace(/\/+$/, '');
      } catch {
        return match[1].toLowerCase();
      }
    }
  }

  /**
   * LinkedIn often redirects vanity URLs to a canonical slug (e.g. jane-doe →
   * jane-doe-a1b2c3). Treat those as the same profile so we don't loop.
   */
  function profileSlugsMatch(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    // Canonical often appends a suffix after the vanity slug.
    if (a.startsWith(`${b}-`) || b.startsWith(`${a}-`)) return true;
    return false;
  }

  function buildExpectedProfileUrl(expectedSlug, searchParams) {
    const url = new URL(
      `https://www.linkedin.com/in/${encodeURIComponent(expectedSlug)}/`,
    );
    for (const key of ['lp_import', 'lp_workspace']) {
      const value = searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  }

  function ensureOnExpectedProfile(stored) {
    const expectedSlug = stored.lp_expected_profile_slug
      ? decodeURIComponent(stored.lp_expected_profile_slug).toLowerCase()
      : null;
    if (!expectedSlug) return true;

    const currentSlug = profileSlugFromUrl(window.location.href);
    if (profileSlugsMatch(currentSlug, expectedSlug)) return true;

    // Only navigate once per import session — LinkedIn canonical redirects
    // otherwise cause an infinite location.replace loop.
    const navKey = `lp_slug_nav_${expectedSlug}`;
    if (sessionStorage.getItem(navKey) === '1') {
      // Already tried; stay on whatever LinkedIn served and continue (or fail later).
      return true;
    }

    sessionStorage.setItem(navKey, '1');
    progress()?.setStep('opening');
    window.location.replace(
      buildExpectedProfileUrl(expectedSlug, new URLSearchParams(window.location.search)),
    );
    return false;
  }

  function profileLooksReady() {
    if (!/\/in\//i.test(window.location.href)) return false;
    const hasName = Boolean(document.querySelector('main h1, h1'));
    const bodyLines = document.body.innerText.split('\n').filter((l) => l.trim()).length;
    return hasName && bodyLines > 20;
  }

  function expandSeeMoreButtons(root) {
    const scope = root || document.querySelector('main') || document.body;

    scope.querySelectorAll(
      'button, .inline-show-more-text__button, span[role="button"]',
    ).forEach((el) => {
      if (
        typeof isFeedOrPostContent === 'function' &&
        isFeedOrPostContent(el)
      ) {
        return;
      }

      const label = `${el.getAttribute('aria-label') || ''} ${el.textContent || ''}`;
      const isExpand =
        typeof isProfileExpandLabel === 'function'
          ? isProfileExpandLabel(label)
          : /see more|show more/i.test(label);

      if (!isExpand) return;

      try {
        el.click();
      } catch {
        // ignore
      }
    });
  }

  async function waitForProfileReady() {
    progress()?.setStep('opening');

    const maxMs = 20000;
    const start = Date.now();

    while (Date.now() - start < maxMs) {
      if (profileLooksReady()) break;
      await sleep(500);
    }

    await sleep(1500);

    progress()?.setStep('readmore');

    try {
      if (typeof prepareProfilePageForParsing === 'function') {
        await prepareProfilePageForParsing(sleep);
      } else {
        const main = document.querySelector('main');
        expandSeeMoreButtons(main);
        await sleep(600);
        expandSeeMoreButtons(main);
        await sleep(400);
      }
    } catch {
      // Best-effort expand — continue to capture even if some buttons fail.
    }
  }

  async function runImportFlow(stored) {
    try {
      if (!ensureOnExpectedProfile(stored)) return;

      const expectedSlug = stored.lp_expected_profile_slug
        ? decodeURIComponent(stored.lp_expected_profile_slug).toLowerCase()
        : null;
      const currentSlug = profileSlugFromUrl(window.location.href);
      if (
        expectedSlug &&
        currentSlug &&
        !profileSlugsMatch(currentSlug, expectedSlug)
      ) {
        const navKey = `lp_slug_nav_${expectedSlug}`;
        // After one redirect attempt, LinkedIn's canonical URL is authoritative
        // for this session — don't block the import on vanity vs canonical slug.
        if (sessionStorage.getItem(navKey) !== '1') {
          const label = stored.lp_expected_profile_name || expectedSlug;
          progress()?.setError(
            `This import is for ${label}'s profile (/in/${expectedSlug}), not the page you're viewing.`,
          );
          return;
        }
      }

      await waitForProfileReady();
      await autoFetchAndReturn(stored);
    } catch (err) {
      progress()?.setError(
        err instanceof Error ? err.message : 'Could not read profile',
      );
    }
  }

  async function autoFetchAndReturn(stored) {
    if (!/\/in\//i.test(window.location.href)) {
      progress()?.setError('Not on a LinkedIn profile page.');
      return;
    }

    const expectedSlug = stored.lp_expected_profile_slug
      ? decodeURIComponent(stored.lp_expected_profile_slug).toLowerCase()
      : null;
    const currentSlug = profileSlugFromUrl(window.location.href);
    if (
      expectedSlug &&
      currentSlug &&
      !profileSlugsMatch(currentSlug, expectedSlug)
    ) {
      const navKey = `lp_slug_nav_${expectedSlug}`;
      if (sessionStorage.getItem(navKey) !== '1') {
        progress()?.setError(
          `Profile mismatch — expected /in/${expectedSlug}.`,
        );
        return;
      }
    }

    if (typeof captureProfileSnapshot !== 'function') {
      progress()?.setError('Extension capture module missing. Reload the extension.');
      return;
    }

    progress()?.setStep('fetching');
    await sleep(300);

    const snapshot = captureProfileSnapshot();
    const returnUrl =
      stored.lp_return_url || 'http://localhost:3000/app/settings?importReview=1';

    progress()?.setStep('sending');
    await sleep(400);

    progress()?.setStep('returning');

    const returnWatchdog = window.setTimeout(() => {
      progress()?.setError(
        'Taking longer than expected. Switch to the linkedinpost Settings tab to continue.',
      );
      window.setTimeout(() => progress()?.hide(), 4000);
    }, 12_000);

    chrome.runtime
      .sendMessage({
        type: 'SUBMIT_IMPORT_SNAPSHOT',
        snapshot,
        returnUrl,
        importToken: stored.lp_import_token,
        workspaceId: stored.lp_workspace_id,
        apiBase: stored.lp_api_base,
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(returnWatchdog));
  }
})();
