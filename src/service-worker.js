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

function createDnrRule(rule) {
  const escapedTerm = rule.urlContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    id: rule.dnrId,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: rule.headers.map(({ name, value }) => ({
        header: name.toLowerCase(),
        operation: 'set',
        value
      }))
    },
    condition: {
      regexFilter: `.*${escapedTerm}.*`,
      isUrlFilterCaseSensitive: false,
      resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
    }
  };
}

async function syncDnr(rules) {
  const activeRules = rules.filter(rule => rule.enabled).map(createDnrRule);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(rule => rule.id),
    addRules: activeRules
  });
}

async function commitPendingRule(pendingId) {
  const hasHostAccess = await chrome.permissions.contains({ origins: ['http://*/*', 'https://*/*'] });
  if (!hasHostAccess) return { ok: false, error: 'HTTP and HTTPS site access has not been granted.' };

  const saved = await chrome.storage.local.get(['rules', 'pendingRuleSave']);
  const pending = saved.pendingRuleSave;
  const rules = Array.isArray(saved.rules) ? saved.rules : [];
  if (!pending || pending.id !== pendingId) {
    return { ok: rules.some(rule => rule.dnrId === pendingId), rules };
  }

  const nextRules = pending.editingId !== null && pending.editingId !== undefined
    ? rules.map(rule => rule.dnrId === pending.editingId ? pending.rule : rule)
    : [...rules.filter(rule => rule.dnrId !== pending.rule.dnrId), pending.rule];

  await syncDnr(nextRules);
  await chrome.storage.local.set({ rules: nextRules });
  const latest = await chrome.storage.local.get('pendingRuleSave');
  if (latest.pendingRuleSave?.id === pendingId) {
    await chrome.storage.local.remove('pendingRuleSave');
  }
  return { ok: true, rules: nextRules };
}

let pendingCommitQueue = Promise.resolve();
function queuePendingCommit(pendingId) {
  pendingCommitQueue = pendingCommitQueue
    .catch(() => {})
    .then(() => commitPendingRule(pendingId));
  return pendingCommitQueue;
}

chrome.permissions.onAdded.addListener(() => {
  chrome.storage.local.get('pendingRuleSave').then(({ pendingRuleSave }) => {
    if (pendingRuleSave?.id) return queuePendingCommit(pendingRuleSave.id);
  }).catch(error => console.error('Could not save the pending Headerly rule:', error));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'COMMIT_PENDING_RULE' || !message.pendingId) return;
  queuePendingCommit(message.pendingId)
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: error.message || 'Could not save the rule.' }));
  return true;
});

chrome.runtime.onInstalled.addListener(enableMatchCountBadge);
chrome.runtime.onStartup.addListener(enableMatchCountBadge);
enableMatchCountBadge();
