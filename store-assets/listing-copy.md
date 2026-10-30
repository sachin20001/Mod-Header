# Headerly — Chrome Web Store listing

Prepared for the Chrome Web Store Developer Dashboard. The required store icon and screenshot are in this folder. The small promo tile is optional.

## Store listing fields

**Item name**

```text
Headerly: HTTP Header Manager
```

**Summary** (132 characters max)

```text
Set multiple HTTP request headers on matching URLs. Organize rules, switch them on or off, and see matches per tab.
```

**Detailed description**

```text
Set custom HTTP request headers on outgoing requests whose URLs contain text you choose. Headerly helps developers and QA teams test APIs and web apps across environments.

Create a rule with a URL term and one or more header name/value pairs. Matching is case-insensitive and checks the request URL, including its host, path, and query string. Open, edit, enable, disable, or delete rules from a compact table. A per-tab badge shows matching request activity.

Headerly saves your rules locally in Chrome and applies them with Chrome's declarative network request engine. It does not send your rules or browsing history to a Headerly server and does not use analytics. The header values you configure are attached to matching requests and sent to those destination websites. Use narrow URL terms and only use sensitive values with trusted destinations.

Before saving a rule, Headerly explains that its header values will be sent with matching requests and asks you to confirm.

The request URL can differ from the page shown in the address bar; an app may call an API on another host. Chrome restricts changes to some request headers. Headerly modifies outgoing request headers and does not inspect response bodies.
```

**Category:** Developer Tools  
**Language:** English  
**Mature content:** No  
**Promo video:** None

## Images

- **Store icon (required):** `../assets/icons/headerly-store-128.png` (declared in the manifest and included in the ZIP)
- **Screenshot (required):** `screenshots/headerly-rules.png` (1280×800) or `screenshots/headerly-rules-640x400.png` (640×400)
- **Small promo tile (optional):** `small-promo-tile.png`
- **Marquee tile (optional):** Not prepared; upload only if you decide you want one.

Chrome's current listing guide requires a 128×128 PNG store icon and at least one 1280×800 or 640×400 screenshot. Store screenshots should show the actual product UI. Optional promo images are 440×280 and 1400×560.

## Additional URLs and distribution

- **Homepage URL:** Leave blank unless you have a public Headerly project page.
- **Support URL:** Add a public support page or issue tracker you control. No URL is configured in this project.
- **Official URL:** Optional; only select a site verified as yours in Search Console.
- **Privacy policy URL:** Required for this extension's locally handled rule data. Publish `privacy-policy.md` at a stable HTTPS URL, then paste that URL in the dashboard. A local file path or repository markdown path is not a public policy URL.
- **Distribution:** Choose Public if you intend to list it for everyone; otherwise select the audience you actually want. The dashboard's default region selection can be retained if you want worldwide availability.

## Privacy practices tab

Use these as reviewer-facing drafts and confirm each dashboard checkbox against the exact wording shown in your account:

- **Single purpose:** “Headerly lets users create URL-contains rules that add or replace request headers on matching outgoing HTTP or HTTPS requests.”
- **`storage` justification:** “Stores user-created URL terms, header names and values, enabled states, and rule IDs locally so rules persist across browser sessions.”
- **`declarativeNetRequestWithHostAccess` justification:** “Applies the user's configured request-header changes through Chrome's declarative network request API.”
- **Optional HTTP/HTTPS host access justification:** “Rules use a text term that can match requests on any host. This optional access is requested when the user saves a rule and lets Chrome apply that rule to matching requests.”
- **Remote code:** No. The extension does not load or execute remotely hosted code.
- **Data handling disclosure:** Headerly handles user-created rule configuration locally. It uses the configured URL term to match requests and sends configured header values only as part of matching requests to their destination websites. It does not send rules, browsing logs, or analytics to the extension developer.
- **In-product disclosure:** The popup explains that configured values go to matching destination websites and requires confirmation before saving a rule.
- **Data categories:** Disclose web-browsing activity because request URLs are evaluated locally to apply the matching feature, and authentication information because users can enter credentials in arbitrary header values. Chrome says local processing/storage still needs disclosure; do not certify that no data is handled.
- **Limited Use certification:** Certify only if the data is used solely for Headerly's user-facing request-header feature, is not sold or used for advertising, and is not transferred to the developer. The user-configured header is still sent to its selected destination as part of the HTTP request.

Chrome's listing fields, screenshot/icon requirements, and privacy disclosures are described in the official guides linked from `README.md`.

## Before submitting

1. Publish the privacy policy at a public HTTPS URL and fill in that field.
2. Add a support URL if you have one.
3. Confirm the dashboard's data categories and certifications match the extension's behavior and the published policy.
4. In **Screenshots**, upload either `screenshots/headerly-rules.png` or `screenshots/headerly-rules-640x400.png`. Upload `small-promo-tile.png` only in the separate promotional image field. The store icon is included in the ZIP.
5. Upload `headerly-1.0.1.zip` with `manifest.json` at its root. Chrome requires each uploaded package to have a higher version than the currently published one.

## Official references

- [Chrome Web Store listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Store listing image guidance](https://developer.chrome.com/docs/webstore/images)
- [Chrome Web Store privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Chrome Web Store user data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
