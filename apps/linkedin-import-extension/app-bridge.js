(function () {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('Extension context invalidated')) {
      document.documentElement.removeAttribute('data-linkedinpost-extension');
    }
  });

  function isExtensionContextValid() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }

  function safeSendMessage(message, callback) {
    if (!isExtensionContextValid()) {
      callback(null, 'Extension was updated. Refresh this page and try again.');
      return;
    }

    let sendMessage;
    try {
      sendMessage = chrome.runtime.sendMessage;
      if (typeof sendMessage !== 'function') {
        callback(null, 'Extension unavailable');
        return;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Extension unavailable';
      callback(null, msg);
      return;
    }

    try {
      sendMessage.call(chrome.runtime, message, (response) => {
        let err = null;
        try {
          err = chrome.runtime.lastError?.message || null;
        } catch {
          err = 'Extension was updated. Refresh this page and try again.';
        }
        if (err?.includes('Extension context invalidated')) {
          document.documentElement.removeAttribute('data-linkedinpost-extension');
          callback(
            null,
            'Extension was updated. Refresh this page and try again.',
          );
          return;
        }
        callback(response, err);
      });
    } catch (err) {
      document.documentElement.removeAttribute('data-linkedinpost-extension');
      const msg =
        err instanceof Error ? err.message : 'Extension unavailable';
      callback(null, msg);
    }
  }

  function profileSlugFromUrl(url) {
    try {
      const match = new URL(url).pathname.match(/\/in\/([^/?#]+)/i);
      return match?.[1]?.toLowerCase() ?? null;
    } catch {
      const match = String(url).match(/\/in\/([^/?#]+)/i);
      return match?.[1]?.toLowerCase() ?? null;
    }
  }

  function publishStagedPreview(preview) {
    try {
      sessionStorage.setItem('lp_staged_import', JSON.stringify(preview));
    } catch {
      // ignore quota errors
    }

    window.dispatchEvent(
      new CustomEvent('linkedinpost-staged-import-ready', { detail: preview }),
    );

    window.postMessage(
      {
        source: 'linkedinpost-extension',
        type: 'LP_IMPORT_PREVIEW',
        preview,
      },
      '*',
    );
  }

  if (isExtensionContextValid()) {
    document.documentElement.setAttribute('data-linkedinpost-extension', '1');
    window.dispatchEvent(new CustomEvent('linkedinpost-extension-ready'));
  }

  // Fallback hydrate from extension storage (background inject is primary path).
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('importReview') === '1' && isExtensionContextValid()) {
      chrome.storage.local.get(
        ['lp_staged_preview', 'lp_expected_profile_slug'],
        (stored) => {
          const preview = stored.lp_staged_preview;
          const expectedSlug = stored.lp_expected_profile_slug?.toLowerCase() ?? null;
          const previewSlug = preview?.profileUrl
            ? profileSlugFromUrl(preview.profileUrl)
            : null;
          if (!preview) return;

          if (expectedSlug && previewSlug && previewSlug !== expectedSlug) {
            chrome.storage.local.remove(['lp_staged_preview']);
            return;
          }

          chrome.storage.local.remove(['lp_staged_preview']);
          publishStagedPreview(preview);
        },
      );
    }
  } catch {
    // ignore
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (data?.source !== 'linkedinpost-web') return;

    if (data.type === 'LP_PING') {
      safeSendMessage({ type: 'PING' }, (response, err) => {
        window.postMessage(
          {
            source: 'linkedinpost-extension',
            type: 'LP_PONG',
            ok: Boolean(response?.ok && !err),
            error: err || undefined,
          },
          '*',
        );
      });
      return;
    }

    if (data.type === 'LP_START_IMPORT') {
      safeSendMessage(
        { type: 'START_IMPORT_SESSION', ...data.payload },
        (response, err) => {
          window.postMessage(
            {
              source: 'linkedinpost-extension',
              type: 'LP_IMPORT_STARTED',
              ok: Boolean(response?.ok && !err),
              error: err || response?.error,
            },
            '*',
          );
        },
      );
    }
  });

  if (!isExtensionContextValid()) return;

  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'LP_IMPORT_PREVIEW') {
        publishStagedPreview(message.preview);
        return;
      }

      if (message.type === 'LP_IMPORT_EXTRACT_ERROR') {
        window.postMessage(
          {
            source: 'linkedinpost-extension',
            type: 'LP_IMPORT_EXTRACT_ERROR',
            error: message.error,
          },
          '*',
        );
      }
    });
  } catch {
    document.documentElement.removeAttribute('data-linkedinpost-extension');
  }
})();
