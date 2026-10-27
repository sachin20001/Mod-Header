# Mod Header

A small Chrome Manifest V3 extension for adding or replacing one or more request headers when a request URL contains text you choose. For example, a term like `qa.example.com/api` matches any HTTP or HTTPS request URL that includes that text. You can keep multiple rules, edit them, and toggle them on or off.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project folder.
4. Open the extension popup, enter a URL term and header, then choose **Add rule**.
5. Grant Chrome's HTTP and HTTPS site access prompt so the term can be checked on any website.

Rules are saved in extension storage and installed as dynamic Declarative Net Request rules, so they persist across browser restarts. Removing a rule removes its active network rule. Site access can be revoked at any time from Chrome's extension settings.

## URL matching and permissions

Enter a plain text term, not a URL pattern. Add as many header name/value pairs as you need to each rule with **Add header**. Matching is case-insensitive and checks the request URL itself, including its host, path, and query string. The rules list stays compact; choose **Open** to view a rule's headers or **Edit** to change them. Because the term could appear on any website, Chrome asks for optional HTTP and HTTPS site access when the first rule is added. Chrome still applies its own restrictions on which request headers an extension can change.

The extension only changes outgoing request headers. It does not read request or response contents. API calls are matched against their own request URLs, which may differ from the URL shown in the browser tab.
