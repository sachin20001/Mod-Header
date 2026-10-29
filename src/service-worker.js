async function enableMatchCountBadge() {
  try {
    await chrome.declarativeNetRequest.setExtensionActionOptions({
      displayActionCountAsBadgeText: true
    });
    await chrome.action.setBadgeBackgroundColor({ color: '#789b32' });
  } catch (error) {
    console.error('Could not enable the request match badge:', error);
  }
}

chrome.runtime.onInstalled.addListener(enableMatchCountBadge);
chrome.runtime.onStartup.addListener(enableMatchCountBadge);
enableMatchCountBadge();
