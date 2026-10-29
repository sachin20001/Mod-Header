const form = document.querySelector('#rule-form');
const containsInput = document.querySelector('#url-contains');
const headersList = document.querySelector('#headers-list');
const addHeaderButton = document.querySelector('#add-header');
const submitButton = document.querySelector('#submit-button');
const cancelButton = document.querySelector('#cancel-edit');
const list = document.querySelector('#rules-list');
const emptyState = document.querySelector('#empty-state');
const tableWrap = document.querySelector('#rules-table-wrap');
const count = document.querySelector('#rule-count');
const status = document.querySelector('#status');
const versionLabel = document.querySelector('#version-label');

let rules = [];
let editingId = null;
let statusTimer;

versionLabel.textContent = `v${chrome.runtime.getManifest().version}`;

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
  clearTimeout(statusTimer);
  if (message) statusTimer = setTimeout(() => { status.textContent = ''; }, 4500);
}

function validateContainsTerm(term) {
  if (!term.trim()) throw new Error('Enter the text to look for in request URLs.');
  if (!/^[\x20-\x7E]+$/.test(term)) {
    throw new Error('Use ASCII characters. Non-ASCII URL characters are percent-encoded in requests.');
  }
  if (term.length > 1000) throw new Error('The URL text is too long.');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateHeaders(headers) {
  if (!headers.length) throw new Error('Add at least one request header.');
  const names = new Set();
  for (const { name, value } of headers) {
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
      throw new Error(`“${name || 'Header'}” is not a valid HTTP header name.`);
    }
    if (!value || /[\r\n]/.test(value)) throw new Error(`Enter a valid value for “${name}”.`);
    const normalized = name.toLowerCase();
    if (names.has(normalized)) throw new Error(`Header “${name}” is listed more than once.`);
    names.add(normalized);
  }
}

function createDnrRule(rule) {
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
      regexFilter: `.*${escapeRegex(rule.urlContains)}.*`,
      isUrlFilterCaseSensitive: false,
      resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
    }
  };
}

async function syncDnr(nextRules) {
  const dnrRules = nextRules.filter(rule => rule.enabled).map(createDnrRule);
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

function addHeaderRow(header = {}) {
  const row = document.createElement('div');
  row.className = 'header-row';
  const name = document.createElement('input');
  name.className = 'header-name-input';
  name.type = 'text';
  name.placeholder = 'Header name';
  name.autocomplete = 'off';
  name.required = true;
  name.value = header.name || '';
  name.setAttribute('aria-label', 'Header name');
  const value = document.createElement('input');
  value.className = 'header-value-input';
  value.type = 'text';
  value.placeholder = 'Header value';
  value.autocomplete = 'off';
  value.required = true;
  value.value = header.value || '';
  value.setAttribute('aria-label', 'Header value');
  const remove = document.createElement('button');
  remove.className = 'remove-header-button';
  remove.type = 'button';
  remove.textContent = '×';
  remove.setAttribute('aria-label', 'Remove header');
  remove.addEventListener('click', () => {
    if (headersList.children.length === 1) {
      name.value = '';
      value.value = '';
      name.focus();
      return;
    }
    row.remove();
  });
  row.append(name, value, remove);
  headersList.append(row);
  return name;
}

function readHeaders() {
  return [...headersList.querySelectorAll('.header-row')].map(row => ({
    name: row.querySelector('.header-name-input').value.trim(),
    value: row.querySelector('.header-value-input').value
  }));
}

function render() {
  list.replaceChildren();
  emptyState.hidden = rules.length > 0;
  tableWrap.hidden = rules.length === 0;
  count.textContent = String(rules.length);

  for (const rule of rules) {
    const row = document.createElement('tr');
    row.className = 'rule-row';
    addText(row, 'td', 'rule-id-cell', `#${rule.dnrId}`);
    addText(row, 'td', 'rule-pattern', rule.urlContains);
    const actionCell = document.createElement('td');
    actionCell.className = 'rule-actions-cell';
    const actions = document.createElement('div');
    actions.className = 'rule-actions';
    const open = addText(actions, 'button', 'text-action', 'Open');
    open.type = 'button';
    open.setAttribute('aria-expanded', 'false');
    const edit = addText(actions, 'button', 'text-action', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', () => beginEdit(rule));
    const remove = addText(actions, 'button', 'text-action delete', 'Delete');
    remove.type = 'button';
    remove.addEventListener('click', () => removeRule(rule.dnrId));
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'toggle';
    toggle.setAttribute('aria-label', `${rule.enabled ? 'Disable' : 'Enable'} rule #${rule.dnrId}`);
    toggle.setAttribute('aria-pressed', String(rule.enabled));
    toggle.addEventListener('click', () => toggleRule(rule.dnrId));
    actions.append(toggle);
    actionCell.append(actions);
    row.append(actionCell);

    const detailsRow = document.createElement('tr');
    detailsRow.className = 'rule-details-row';
    detailsRow.hidden = true;
    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 3;
    detailsCell.className = 'rule-details-cell';
    for (const header of rule.headers) {
      const line = document.createElement('div');
      line.className = 'rule-header';
      const strong = document.createElement('b');
      strong.textContent = `${header.name}: `;
      line.append(strong, document.createTextNode(header.value));
      detailsCell.append(line);
    }
    detailsRow.append(detailsCell);
    open.addEventListener('click', () => {
      detailsRow.hidden = !detailsRow.hidden;
      open.textContent = detailsRow.hidden ? 'Open' : 'Close';
      open.setAttribute('aria-expanded', String(!detailsRow.hidden));
    });
    list.append(row, detailsRow);
  }
}

function beginEdit(rule) {
  editingId = rule.dnrId;
  containsInput.value = rule.urlContains;
  headersList.replaceChildren();
  rule.headers.forEach(addHeaderRow);
  submitButton.innerHTML = 'Save changes <span aria-hidden="true">✓</span>';
  cancelButton.hidden = false;
  containsInput.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  form.reset();
  headersList.replaceChildren();
  addHeaderRow();
  editingId = null;
  submitButton.innerHTML = 'Add rule <span aria-hidden="true">＋</span>';
  cancelButton.hidden = true;
}

addHeaderButton.addEventListener('click', () => addHeaderRow().focus());
cancelButton.addEventListener('click', resetForm);

form.addEventListener('submit', async event => {
  event.preventDefault();
  showStatus('');
  const urlContains = containsInput.value.trim();
  const headers = readHeaders();
  try {
    validateContainsTerm(urlContains);
    validateHeaders(headers);
    const hostOrigins = ['http://*/*', 'https://*/*'];
    const granted = await chrome.permissions.request({ origins: hostOrigins });
    if (!granted) throw new Error('Grant HTTP and HTTPS site access to apply this rule on any website.');

    const existing = rules.find(rule => rule.dnrId === editingId);
    const dnrId = existing?.dnrId ?? Math.max(0, ...rules.map(rule => rule.dnrId)) + 1;
    const newRule = {
      id: dnrId,
      dnrId,
      urlContains,
      headers,
      enabled: existing?.enabled ?? true
    };
    const nextRules = existing
      ? rules.map(rule => rule.dnrId === editingId ? newRule : rule)
      : [...rules, newRule];
    await persist(nextRules);
    resetForm();
    showStatus(existing ? 'Rule updated.' : 'Rule added.');
  } catch (error) {
    showStatus(error.message || 'Could not save this rule.', true);
  }
});

async function removeRule(id) {
  try {
    await persist(rules.filter(rule => rule.dnrId !== id));
    if (editingId === id) resetForm();
    showStatus(`Rule #${id} deleted.`);
  } catch (error) { showStatus(error.message || 'Could not delete this rule.', true); }
}

async function toggleRule(id) {
  try {
    await persist(rules.map(rule => rule.dnrId === id ? { ...rule, enabled: !rule.enabled } : rule));
  } catch (error) { showStatus(error.message || 'Could not update this rule.', true); }
}

async function initialize() {
  try {
    const saved = await chrome.storage.local.get('rules');
    rules = Array.isArray(saved.rules)
      ? saved.rules.map(rule => {
          const migratedHeaders = rule.headers || (rule.headerName ? [{ name: rule.headerName, value: rule.headerValue }] : []);
          const urlContains = rule.urlContains || (rule.urlPattern || '').replace(/\*+/g, '');
          return { ...rule, id: rule.dnrId, urlContains, headers: migratedHeaders };
        })
      : [];
    if (Array.isArray(saved.rules)) await chrome.storage.local.set({ rules });
    await syncDnr(rules);
    render();
  } catch (error) {
    showStatus(error.message || 'Could not load saved rules.', true);
  }
}

addHeaderRow();
initialize();
