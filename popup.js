const form = document.querySelector('#rule-form');
const patternInput = document.querySelector('#url-pattern');
const headerNameInput = document.querySelector('#header-name');
const headerValueInput = document.querySelector('#header-value');
const submitButton = document.querySelector('#submit-button');
const cancelButton = document.querySelector('#cancel-edit');
const list = document.querySelector('#rules-list');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#rule-count');
const status = document.querySelector('#status');

let rules = [];
let editingId = null;
let statusTimer;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
  clearTimeout(statusTimer);
  if (message) statusTimer = setTimeout(() => { status.textContent = ''; }, 4500);
}

function validatePattern(pattern) {
  const match = pattern.match(/^(https?):\/\/(\*\.)?([a-zA-Z0-9.-]+)(?::(\d{1,5}))?(\/.*)?$/);
  if (!match || pattern.includes(' ')) {
    throw new Error('Use an HTTP or HTTPS URL pattern, such as https://qa.example.com/api/*');
  }
  const [, scheme, wildcardSubdomain, hostname, port] = match;
  if (hostname.startsWith('.') || hostname.endsWith('.') || hostname.includes('..')) {
    throw new Error('Enter a valid host name in the URL pattern.');
  }
  if (port && (Number(port) < 1 || Number(port) > 65535)) throw new Error('The port must be between 1 and 65535.');
  const permissionHost = `${scheme}://${wildcardSubdomain || ''}${hostname}${port ? `:${port}` : ''}/*`;
  const regex = `^${escapeRegex(pattern).replaceAll('\\*', '.*')}$`;
  if (regex.length > 2000) throw new Error('This URL pattern is too long.');
  return { permissionHost, regex };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateHeader(name, value) {
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
    throw new Error('Header names can contain letters, numbers, and standard HTTP token characters.');
  }
  if (/[\r\n]/.test(value)) throw new Error('Header values cannot contain line breaks.');
  if (!value) throw new Error('Enter a header value.');
}

function createDnrRule(rule, ruleId) {
  const { regex } = validatePattern(rule.urlPattern);
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{ header: rule.headerName.toLowerCase(), operation: 'set', value: rule.headerValue }]
    },
    condition: { regexFilter: regex, resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other'] }
  };
}

async function syncDnr(nextRules) {
  const enabled = nextRules.filter(rule => rule.enabled);
  const dnrRules = enabled.map(rule => createDnrRule(rule, rule.dnrId));
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(rule => rule.id),
    addRules: dnrRules
  });
}

async function persist(nextRules) {
  await syncDnr(nextRules);
  await chrome.storage.local.set({ rules: nextRules });
  rules = nextRules;
  render();
}

function addText(parent, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function render() {
  list.replaceChildren();
  emptyState.hidden = rules.length > 0;
  count.textContent = String(rules.length);
  for (const rule of rules) {
    const item = document.createElement('li');
    item.className = 'rule-card';
    const top = document.createElement('div');
    top.className = 'rule-top';
    addText(top, 'div', 'rule-pattern', rule.urlPattern);
    item.append(top);
    const headerLine = document.createElement('div');
    headerLine.className = 'rule-header';
    const strong = document.createElement('b');
    strong.textContent = `${rule.headerName}: `;
    headerLine.append(strong, document.createTextNode(rule.headerValue));
    item.append(headerLine);
    const actions = document.createElement('div');
    actions.className = 'rule-actions';
    const edit = addText(actions, 'button', 'text-action', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', () => beginEdit(rule));
    const remove = addText(actions, 'button', 'text-action delete', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', () => removeRule(rule.id));
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'toggle';
    toggle.setAttribute('aria-label', `${rule.enabled ? 'Disable' : 'Enable'} rule for ${rule.urlPattern}`);
    toggle.setAttribute('aria-pressed', String(rule.enabled));
    toggle.addEventListener('click', () => toggleRule(rule.id));
    actions.append(toggle);
    item.append(actions);
    list.append(item);
  }
}

function beginEdit(rule) {
  editingId = rule.id;
  patternInput.value = rule.urlPattern;
  headerNameInput.value = rule.headerName;
  headerValueInput.value = rule.headerValue;
  submitButton.innerHTML = 'Save changes <span aria-hidden="true">✓</span>';
  cancelButton.hidden = false;
  patternInput.focus();
}

function resetForm() {
  form.reset();
  editingId = null;
  submitButton.innerHTML = 'Add rule <span aria-hidden="true">＋</span>';
  cancelButton.hidden = true;
}

cancelButton.addEventListener('click', resetForm);

form.addEventListener('submit', async event => {
  event.preventDefault();
  showStatus('');
  const urlPattern = patternInput.value.trim();
  const headerName = headerNameInput.value.trim();
  const headerValue = headerValueInput.value;
  try {
    const { permissionHost } = validatePattern(urlPattern);
    validateHeader(headerName, headerValue);
    const granted = await chrome.permissions.request({ origins: [permissionHost] });
    if (!granted) throw new Error(`Grant access to ${permissionHost} to apply this rule.`);

    const existing = editingId ? rules.find(rule => rule.id === editingId) : null;
    const newRule = {
      id: existing?.id ?? crypto.randomUUID(),
      dnrId: existing?.dnrId ?? Math.max(0, ...rules.map(rule => rule.dnrId)) + 1,
      urlPattern,
      headerName,
      headerValue,
      enabled: existing?.enabled ?? true
    };
    const nextRules = existing ? rules.map(rule => rule.id === editingId ? newRule : rule) : [...rules, newRule];
    await persist(nextRules);
    resetForm();
    showStatus(existing ? 'Rule updated.' : 'Rule added.');
  } catch (error) {
    showStatus(error.message || 'Could not save this rule.', true);
  }
});

async function removeRule(id) {
  try {
    await persist(rules.filter(rule => rule.id !== id));
    if (editingId === id) resetForm();
    showStatus('Rule removed.');
  } catch (error) { showStatus(error.message || 'Could not remove this rule.', true); }
}

async function toggleRule(id) {
  try {
    await persist(rules.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  } catch (error) { showStatus(error.message || 'Could not update this rule.', true); }
}

async function initialize() {
  try {
    const saved = await chrome.storage.local.get('rules');
    rules = Array.isArray(saved.rules) ? saved.rules : [];
    await syncDnr(rules);
    render();
  } catch (error) {
    showStatus(error.message || 'Could not load saved rules.', true);
  }
}

initialize();
