const openAppLink = document.getElementById('openApp');

const DEFAULT_APP_URL = 'http://localhost:3000/app/settings';

async function resolveAppSettingsUrl() {
  const stored = await chrome.storage.local.get(['lp_return_url', 'lp_api_base']);

  if (stored.lp_return_url) {
    try {
      const url = new URL(stored.lp_return_url);
      url.searchParams.delete('importReview');
      return url.toString();
    } catch {
      // fall through
    }
  }

  if (stored.lp_api_base?.includes('linkedinpost.ai')) {
    return 'https://app.linkedinpost.ai/app/settings';
  }

  return DEFAULT_APP_URL;
}

openAppLink.addEventListener('click', async (event) => {
  event.preventDefault();
  const url = await resolveAppSettingsUrl();
  chrome.tabs.create({ url, active: true });
  window.close();
});

resolveAppSettingsUrl().then((url) => {
  openAppLink.href = url;
});
