# Changelog

Changes are grouped by extension version. Add new work under **Unreleased** first, then move it into a versioned section when updating `version` in `manifest.json`.

## Unreleased

### Added

- Headerly branded toolbar, extension page, and popup icons.
- In-popup disclosure and confirmation that configured headers are sent to matching destinations.
- Chrome Web Store listing copy, privacy-policy draft, screenshot, and promotional tile.

### Changed

- Organized popup code under `src/`, icons under `assets/icons/`, and architecture notes under `docs/`.

### Planned

- Add future changes here before assigning them to a release.

## 1.0.0 — Initial release

### Added

- Chrome Manifest V3 extension for setting outgoing request headers.
- Case-insensitive URL-contains matching for HTTP and HTTPS requests.
- Multiple header name/value pairs within each rule.
- Add, edit, enable, disable, open, and delete rule actions.
- Compact rules table showing rule ID and URL term; open a rule to inspect its headers.
- Per-tab request match count on the extension toolbar badge.
- Version label in the popup, read from the manifest.
- Persistent rules using Chrome local storage and dynamic Declarative Net Request rules.
- Optional host access requested when adding or editing a rule.
