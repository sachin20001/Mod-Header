# Mod Header

A small Chrome Manifest V3 extension for adding or replacing request headers on URLs you choose. Rules use custom URL patterns with `*` wildcards, such as `https://qa.example.com/api/*`. You can keep multiple rules, edit them, and toggle them on or off.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project folder.
4. Open the extension popup, enter a URL pattern and header, then choose **Add rule**.
5. Grant Chrome's host access prompt for that rule's host.

Rules are saved in extension storage and installed as dynamic Declarative Net Request rules, so they persist across browser restarts. Removing a rule removes its active network rule. Host permission can be revoked at any time from Chrome's extension settings.

## URL patterns and permissions

Patterns must start with `http://` or `https://`. `*` matches any sequence of characters. The extension asks for access to the host named in each rule, including subdomains if the pattern uses `*.`. Chrome still applies its own restrictions on which request headers an extension can change.

The extension only changes outgoing request headers. It does not read request or response contents. API calls are matched against their own request URLs, which may differ from the URL shown in the browser tab.
