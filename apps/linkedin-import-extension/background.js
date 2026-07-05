const APP_TAB_PATTERNS = [
  'http://localhost:3000/*',
  'http://127.0.0.1:3000/*',
  'https://*.linkedinpost.ai/*',
];

/** apiBase from web is `http://localhost:3001/v1` — do not prepend /v1 again. */
function workspaceApiUrl(apiBase, workspaceId, resourcePath) {
  const base = String(apiBase || 'http://localhost:3001/v1').replace(/\/$/, '');
  const path = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  return `${base}/workspaces/${workspaceId}${path}`;
}

function notifyAppTabs(payload) {
  chrome.tabs.query({ url: APP_TAB_PATTERNS }, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
    }
  });
}

function injectPreviewIntoTab(tabId, previewJson) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: (json) => {
      try {
        sessionStorage.setItem('lp_staged_import', json);
        const preview = JSON.parse(json);
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
      } catch {
        // ignore
      }
    },
    args: [previewJson],
  });
}

function returnToApp(returnUrl, linkedInTabId) {
  const closeLinkedIn = () => {
    if (!linkedInTabId) return;

    chrome.tabs
      .sendMessage(linkedInTabId, { type: 'LP_IMPORT_PROGRESS', step: 'done' })
      .catch(() => {});

    setTimeout(() => {
      chrome.tabs.remove(linkedInTabId).catch(() => {});
    }, 700);
  };

  const focusTab = (tabId) => {
    chrome.tabs.update(tabId, { active: true, url: returnUrl }, () => {
      const err = chrome.runtime.lastError?.message;
      if (err) {
        chrome.tabs.create({ url: returnUrl, active: true }, closeLinkedIn);
        return;
      }

      closeLinkedIn();
    });
  };

  chrome.tabs.query({ url: APP_TAB_PATTERNS }, (appTabs) => {
    const appTab = appTabs.find((t) => t.id && t.id !== linkedInTabId);
    if (appTab?.id) {
      focusTab(appTab.id);
      return;
    }

    chrome.storage.local.get(['lp_source_tab_id'], (stored) => {
      const sourceTabId = stored.lp_source_tab_id;
      if (sourceTabId && sourceTabId !== linkedInTabId) {
        focusTab(sourceTabId);
        return;
      }

      chrome.tabs.create({ url: returnUrl, active: true }, closeLinkedIn);
    });
  });
}

function navigateSettingsTab(returnUrl, linkedInTabId) {
  returnToApp(returnUrl, linkedInTabId);
}

function deliverPreviewWhenReady(preview) {
  const previewJson = JSON.stringify(preview);

  chrome.storage.local.get(['lp_source_tab_id'], (stored) => {
    const sourceTabId = stored.lp_source_tab_id;

    const inject = () => {
      if (!sourceTabId) {
        notifyAppTabs({ type: 'LP_IMPORT_PREVIEW', preview });
        return;
      }
      injectPreviewIntoTab(sourceTabId, previewJson).catch(() => {
        notifyAppTabs({ type: 'LP_IMPORT_PREVIEW', preview });
      });
    };

    if (!sourceTabId) {
      inject();
      return;
    }

    chrome.tabs.get(sourceTabId, (tab) => {
      if (tab?.status === 'complete') {
        inject();
        return;
      }
      const listener = (tabId, info) => {
        if (tabId !== sourceTabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(listener);
        inject();
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  });
}

function deliverPreviewAndReturn(preview, returnUrl, linkedInTabId) {
  const previewJson = JSON.stringify(preview);

  chrome.storage.local.get(['lp_source_tab_id'], (stored) => {
    const sourceTabId = stored.lp_source_tab_id;

    const finishLinkedIn = () => {
      if (!linkedInTabId) return;

      chrome.tabs
        .sendMessage(linkedInTabId, { type: 'LP_IMPORT_PROGRESS', step: 'done' })
        .catch(() => {});

      setTimeout(() => {
        chrome.tabs.remove(linkedInTabId).catch(() => {});
      }, 1400);
    };

    if (!sourceTabId) {
      chrome.tabs.create({ url: returnUrl, active: true }, (tab) => {
        if (!tab?.id) {
          finishLinkedIn();
          return;
        }
        const onUpdated = (updatedTabId, info) => {
          if (updatedTabId !== tab.id || info.status !== 'complete') return;
          chrome.tabs.onUpdated.removeListener(onUpdated);
          injectPreviewIntoTab(tab.id, previewJson)
            .catch(() => notifyAppTabs({ type: 'LP_IMPORT_PREVIEW', preview }))
            .finally(finishLinkedIn);
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
      });
      return;
    }

    chrome.tabs.update(sourceTabId, { active: true, url: returnUrl }, () => {
      let delivered = false;

      const deliver = () => {
        if (delivered) return;
        delivered = true;
        injectPreviewIntoTab(sourceTabId, previewJson)
          .catch(() => notifyAppTabs({ type: 'LP_IMPORT_PREVIEW', preview }))
          .finally(finishLinkedIn);
      };

      const onUpdated = (updatedTabId, info) => {
        if (updatedTabId !== sourceTabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        deliver();
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      chrome.tabs.get(sourceTabId, (tab) => {
        if (tab?.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
          deliver();
        }
      });
    });
  });
}

function focusReturnTab(returnUrl, linkedInTabId) {
  returnToApp(returnUrl, linkedInTabId);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'START_IMPORT_SESSION') {
    const {
      importToken,
      workspaceId,
      apiBase,
      linkedInUrl,
      returnUrl,
      expectedProfileSlug,
      profileName,
    } = message;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const sourceTabId = tabs[0]?.id ?? null;

      chrome.storage.local
        .remove(['lp_staged_preview'])
        .then(() =>
          chrome.storage.local.set({
            lp_import_token: importToken,
            lp_workspace_id: workspaceId,
            lp_api_base: apiBase,
            lp_return_url: returnUrl,
            lp_source_tab_id: sourceTabId,
            lp_expected_profile_slug: expectedProfileSlug ?? null,
            lp_expected_profile_name: profileName ?? null,
            lp_auto_import_done: false,
            lp_import_session_expires: Date.now() + 15 * 60 * 1000,
          }),
        )
        .then(() => {
          chrome.tabs.create({ url: linkedInUrl, active: true });
          sendResponse({ ok: true });
        })
        .catch((err) => {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : 'Could not start session',
          });
        });
    });
    return true;
  }

  if (message.type === 'SUBMIT_IMPORT_SNAPSHOT') {
    const { snapshot, returnUrl, importToken, workspaceId, apiBase } = message;
    const linkedInTabId = sender.tab?.id ?? null;
    const apiUrl = workspaceApiUrl(
      apiBase,
      workspaceId,
      '/linkedin/profile/import/extract',
    );

    // Return to Settings immediately — LLM extraction continues in background.
    returnToApp(returnUrl, linkedInTabId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        importToken,
        profileUrl: snapshot.profileUrl,
        pageText: snapshot.pageText,
      }),
    })
      .then(async (response) => {
        clearTimeout(timeoutId);
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text };
        }

        if (!response.ok) {
          const errorMsg =
            data?.error || data?.message || `HTTP ${response.status}`;
          notifyAppTabs({
            type: 'LP_IMPORT_EXTRACT_ERROR',
            error: errorMsg,
          });
          if (linkedInTabId) {
            chrome.tabs
              .sendMessage(linkedInTabId, {
                type: 'LP_IMPORT_EXTRACT_ERROR',
                error: errorMsg,
              })
              .catch(() => {});
            returnToApp(returnUrl, linkedInTabId);
          }
          sendResponse({
            ok: false,
            error: errorMsg,
          });
          return;
        }

        const preview = data.data ?? data;

        chrome.storage.local.set(
          {
            lp_staged_preview: preview,
            lp_import_session_expires: 0,
            lp_auto_import_done: true,
          },
          () => {
            deliverPreviewWhenReady(preview);
            sendResponse({ ok: true });
          },
        );
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        const error =
          err instanceof Error && err.name === 'AbortError'
            ? 'Profile extraction timed out. Try again.'
            : err instanceof Error
              ? err.message
              : 'Network error';
        notifyAppTabs({ type: 'LP_IMPORT_EXTRACT_ERROR', error });
        sendResponse({ ok: false, error });
      });

    return true;
  }

  if (message.type === 'SUBMIT_IMPORT_PREVIEW') {
    const preview = message.preview;
    const returnUrl = message.returnUrl;

    chrome.storage.local.set(
      {
        lp_staged_preview: preview,
        lp_import_session_expires: 0,
        lp_auto_import_done: true,
      },
      () => {
        deliverPreviewAndReturn(preview, returnUrl, sender.tab?.id ?? null);
      },
    );

    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'IMPORT_PROFILE') {
    fetch(message.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(message.body),
    })
      .then(async (response) => {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text };
        }
        if (!response.ok) {
          sendResponse({
            ok: false,
            error: data?.error || data?.message || `HTTP ${response.status}`,
          });
          return;
        }
        sendResponse({ ok: true, data: data.data ?? data });
      })
      .catch((err) => {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : 'Network error',
        });
      });
    return true;
  }
});
