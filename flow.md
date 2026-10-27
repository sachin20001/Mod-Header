# Mod Header: repository flow

This document explains how the extension starts, how its files fit together, and what happens when a rule is added or used.

## What the extension does

Mod Header is a Chrome Manifest V3 extension. You enter text to look for in a request URL and one or more HTTP header name/value pairs. If the request URL contains that text (case-insensitive), Chrome adds or replaces those request headers. Rules can be opened to inspect, edited, disabled, enabled, or deleted, and are saved between browser sessions.

## Entry point and file map

Chrome reads [`manifest.json`](manifest.json) first when the extension is loaded. Its `action.default_popup` points to [`popup.html`](popup.html), which is the user interface entry point. The popup loads [`popup.css`](popup.css) for presentation and [`popup.js`](popup.js) for behavior.

The popup calls Chrome's extension APIs directly. [`service-worker.js`](service-worker.js) enables a per-tab match counter in Chrome's toolbar badge. The browser's Declarative Net Request engine applies the registered rules to network traffic after the popup closes.

| File | Responsibility |
| --- | --- |
| [`manifest.json`](manifest.json) | Declares MV3, popup, storage and DNR permissions, and optional HTTP/HTTPS host access. |
| [`service-worker.js`](service-worker.js) | Enables the DNR action count as a toolbar badge on install, startup, and worker load. |
| [`popup.html`](popup.html) | Defines the rule form, dynamic header rows, empty state, rules table, status message, and script/style links. |
| [`popup.css`](popup.css) | Styles the popup and rule cards. |
| [`popup.js`](popup.js) | Validates input, requests host access, stores rules, updates DNR rules, and renders the UI. |
| [`README.md`](README.md) | Quick install and user-facing behavior notes. |
| [`flow.md`](flow.md) | Architecture and call-flow guide (this document). |

## Startup flow

```text
Chrome loads manifest.json
        |
        +-- toolbar click opens popup.html
                    |
                    +-- loads popup.css and popup.js
                                |
                                +-- initialize()
                                     |-- chrome.storage.local.get('rules')
                                     |-- syncDnr(rules)
                                     |-- render()
```

`initialize()` runs once at the bottom of `popup.js`. It loads the saved rules (or uses an empty list), synchronizes Chrome's current dynamic rules with the saved enabled rules, then draws the list. If startup fails, `showStatus()` displays the error.

## Rule data

Each saved rule has this shape:

```js
{
  id: 1,                           // same numeric identifier shown in the rule list
  dnrId: 1,                        // numeric ID used by Chrome DNR
  urlContains: "qa.example.com/api",
  headers: [
    { name: "X-Environment", value: "QA" },
    { name: "X-Test-Run", value: "smoke" }
  ],
  enabled: true
}
```

`id` and `dnrId` use the same number: the UI displays it as the rule ID and Chrome uses it as the dynamic rule identifier. `headers` is the list edited by the plus button. `enabled` controls whether the rule is included in Chrome's active dynamic rule set.

## Add or edit flow

The form's `submit` listener owns both creating and saving a rule. It follows this sequence:

```text
form submit
  -> validateContainsTerm(urlContains)
  -> validateHeaders(headers[])
  -> check/request HTTP + HTTPS host access
  -> build newRule (reuse IDs when editing)
  -> persist(nextRules)
       -> syncDnr(nextRules)
       -> chrome.storage.local.set({ rules: nextRules })
       -> update in-memory rules
       -> render()
  -> resetForm()
  -> showStatus(success message)
```

`validateContainsTerm()` checks that the search text is non-empty, printable ASCII and within the supported length. `escapeRegex()` makes the text literal in the DNR regular expression, so characters such as `.`, `*`, `?`, and `|` are searched as typed rather than treated as pattern syntax.

`validateHeaders()` checks every header name and value, and rejects duplicate names (ignoring case). Chrome may still reject some header names or values due to its own DNR restrictions; those API errors are caught and shown through `showStatus()`.

When editing, `beginEdit(rule)` copies the rule values into the form and sets `editingId`. The submit handler finds that existing rule and keeps its IDs and enabled state. `resetForm()` clears the fields and exits edit mode. The Cancel edit button also calls `resetForm()`.

## Enable, disable, and remove flows

`render()` creates a compact table row for each rule with its ID, URL term, actions, and an initially closed details row:

- **Open** expands the details section to show header names and values; **Close** collapses it.
- **Edit** calls `beginEdit(rule)`, which fills the form and header rows.
- **Delete** calls `removeRule(rule.dnrId)`, which filters out that rule and calls `persist()`.
- **Toggle** calls `toggleRule(rule.dnrId)`, which flips `enabled` and calls `persist()`.

Every successful change goes through `persist()`, so the stored rule list and Chrome's active rules are kept in sync. Errors are caught by the action handler and displayed with `showStatus()`.

## How request headers are changed

The browser does not call `popup.js` for each network request. Instead, `syncDnr()` converts each enabled saved rule using `createDnrRule()` and installs the result with `chrome.declarativeNetRequest.updateDynamicRules()`.

Each Chrome rule represents a URL term and all headers configured for that term. It uses:

- `condition.regexFilter` with the search text escaped as a literal substring and a case-insensitive match.
- `condition.resourceTypes` for supported request types.
- An action of `modifyHeaders`, with operation `set` for each configured header.

Chrome then applies matching rules to outgoing requests, whether they came from a page navigation, script, image, or API call. The request URL is what gets matched; it can differ from the URL in the address bar. The extension does not inspect response headers or response bodies.

## Match transparency

`service-worker.js` calls `chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true })`. Chrome displays a per-tab count on the extension's toolbar icon as requests match the rules. The popup explains what the badge means. This provides a quiet signal without opening a notification for every request, which could be noisy on pages that make many API calls. The DNR matched-rule debug event is restricted to unpacked extensions, so it is not used for the normal user-facing indicator.

## Permissions

The manifest requests `storage` and `declarativeNetRequestWithHostAccess`. HTTP/HTTPS host access is optional. A contains term can match a URL on any domain, so adding a rule asks Chrome for HTTP and HTTPS site access. This optional access is required for DNR to modify headers on matching hosts. Users can revoke site access in Chrome's extension settings.

## Where to change things

- Change labels or form layout in `popup.html`.
- Change appearance in `popup.css`.
- Change validation, persistence, or call behavior in `popup.js`.
- Change Chrome API permissions or popup registration in `manifest.json`.
- Update setup instructions in `README.md`.

After changing `manifest.json` or extension code, reload the unpacked extension from `chrome://extensions` to load the changes.
