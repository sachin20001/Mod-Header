# Headerly

A small Chrome Manifest V3 extension for adding or replacing one or more request headers when a request URL contains text you choose. For example, a term like `qa.example.com/api` matches any HTTP or HTTPS request URL that includes that text. You can keep multiple rules, edit them, and toggle them on or off. A badge on the extension icon counts matching requests for the current tab.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project folder.
4. Open the extension popup, enter a URL term and header, then choose **Add rule**.
5. Grant Chrome's HTTP and HTTPS site access prompt so the term can be checked on any website.

Rules are saved in extension storage and installed as dynamic Declarative Net Request rules, so they persist across browser restarts. Removing a rule removes its active network rule. Site access can be revoked at any time from Chrome's extension settings.

## URL matching and permissions

Enter a plain text term, not a URL pattern. Add as many header name/value pairs as you need to each rule with **Add header**. Matching is case-insensitive and checks the request URL itself, including its host, path, and query string. Before saving, Headerly explains that configured values are sent to matching destination websites and asks you to confirm. The rules list stays compact; choose **Open** to view a rule's headers or **Edit** to change them. A badge on the extension icon shows how many requests matched on the current tab; pin the extension to the toolbar to keep the indicator visible. Because the term could appear on any website, Chrome asks for optional HTTP and HTTPS site access when the first rule is added. Chrome still applies its own restrictions on which request headers an extension can change.

The extension only changes outgoing request headers. It does not read request or response contents. API calls are matched against their own request URLs, which may differ from the URL shown in the browser tab.

## Project structure

- `manifest.json` — Chrome extension configuration and entry points.
- `src/` — popup UI, popup logic, styles, and the service worker.
- `assets/icons/` — editable SVG logo source and PNG sizes used by Chrome.
- `docs/flow.md` — architecture and code flow.
- `CHANGELOG.md` — changes grouped by release version.
- `store-assets/` — Chrome Web Store listing copy, screenshots, and promotional art.

Store submission copy and the privacy-policy draft are in `store-assets/`. The privacy policy must be hosted at a public HTTPS URL before submission.
