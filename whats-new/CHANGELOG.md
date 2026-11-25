# Changelog

Newest first. Every release bumps `manifest.json` and `package.json` together.

## 1.2.1 (2026-11-25)

- Changed: with a feed URL set and no active messages, an app that leaves its own content blank now shows "No notifications right now." instead of "No content configured."
- Changed: HTML inside a feed message gets consistent spacing and type for paragraphs, headings, lists, links and small text.
- Docs: ArcGIS Online checks text fields for unsafe HTML and rejects the whole edit (error 1006). Paragraphs, bold and lists are known to save; a message using `<h4>` and `<small>` was rejected. The widget README lists what to use.

## 1.2.0 (2026-11-25)

- Added: notification feed. The widget can read messages from a shared hosted table (ArcGIS Online or ArcGIS Enterprise), so a notice such as planned maintenance reaches every app that carries the widget without a republish. Messages have a type (what's new, info, maintenance, outage), an optional start and end time, and can be aimed at all apps, internal or external apps, or a list of app tags. New module `src/shared/feed.ts`; new settings section "Notification feed" with a Test button.
- Added: a message flagged `popup` opens the panel by itself, once per user. The bell takes the Calcite warning or danger color while a maintenance or outage message is active. Both can be turned off in settings.
- Security: feed text is sanitized before display. Only simple formatting tags and http, https, mailto and tel links survive.
- Changed: in link mode with "Open in new tab", the bell opens the panel when feed messages are active and shows the link as a button below them. With no feed messages it opens the tab directly, as before.
- No change for apps that leave the feed URL blank. New config fields are optional, so apps saved with 1.1.x keep working.
- Translations: the new settings strings are English until the next exb-i18n-kit sync.

## 1.1.5 (2026-09-18)

- Security: the beacon's session id now falls back to `crypto.getRandomValues` and then to a clock value instead of `Math.random`, which CodeQL flags as insecure randomness (shared beacon 1.1.1). The id only groups one page load's events; it is never a secret or a credential.
- Build: `tsconfig.json` is `jsx: react-jsx` with `jsxImportSource: @emotion/react`, matching the Experience Builder client. ts-loader reads the widget tsconfig, and the previous classic `jsx: react` setting made the settings panel and runtime fail with "Cannot convert undefined or null to object" after a full rebuild. No functional change.

## 1.1.4 (2026-09-18)

- Added: anonymous usage and error telemetry (shared beacon module; off unless the portal publishes an exb-beacon-sink table; telemetry: false in config disables it).

## 1.1.3 (2026-09-17)

- Packaging: removed `src/emotion-jsx-runtime.d.ts`; the master editor shim already declares `@emotion/react/jsx-runtime` and the release zip must not carry an ambient copy. (1.1.2 was cut before the file was deleted from the source folder and still ships it; use 1.1.3.)

## 1.1.1 (2026-09-17)

- Packaging: the Visual Studio editor shims are no longer in the release zip. `publish.ps1` strips them from a staging copy (`$ReleaseOnlyExclude`) and refuses to zip if any ambient `declare module` of react, jimu or esri survives. The shims stay in the GitHub repo; clone users delete them before building.
- Editor: widget-level `tsconfig.json` moved to the self-contained mode B setup for Experience Builder 1.21 (pnpm): no `paths`, `"types": []`, master `src/exb-editor-shims.d.ts` copied from `widgets\_vs`, widget-specific declarations in `src/vendor-shims.d.ts`. `npx tsc -p .` reports 0 errors. Webpack output is unchanged (jsx settings kept).

## Earlier releases

See the GitHub releases page and the changelog section of the README, if any.
