# Headerly Privacy Policy

**Last updated: 2026-10-29**

Headerly lets you configure HTTP request-header rules for URLs that contain text you choose.

## Information handled by the extension

Headerly stores the rules you create in Chrome's local extension storage. A rule can include a URL matching term, header names and values, an enabled state, and an ID. These rules remain on your device unless you export, copy, or otherwise share them yourself. Header values may contain sensitive information, such as test credentials, if you choose to enter it.

Chrome's declarative network request engine compares outgoing request URLs with the terms in your enabled rules. Headerly does not keep a browsing history or log full request URLs, and does not read request bodies or response contents.

## How information is used and shared

Headerly uses your rules only to apply the configured headers to requests whose URLs match. The configured header names and values are sent to the website receiving each matching request. Only create rules for destinations you trust, and use narrow URL terms when working with sensitive values.

Before a rule can be saved, Headerly displays this behavior in the popup and asks you to confirm that the values will be sent to matching websites.

The extension developer does not receive your rules, matching URLs, request contents, or usage analytics. Headerly does not sell this information or share it with the developer or analytics providers.

## Permissions

Headerly uses Chrome storage to keep rules between sessions and Chrome's declarative network request API to apply them. Optional HTTP and HTTPS host access is requested because a URL-contains term may match a request to any website. You can revoke site access in Chrome's extension settings.

## Retention and deletion

Rules are retained in Chrome's local extension storage until you delete them or remove the extension. You can delete individual rules from the popup. Uninstalling the extension removes its local extension data according to Chrome's storage behavior.

## Changes and contact

This policy may be updated if Headerly's data practices change. For privacy questions, contact the publisher through the support contact shown on Headerly's Chrome Web Store listing.
